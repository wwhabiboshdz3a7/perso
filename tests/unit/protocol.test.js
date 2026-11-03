import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodePacket, decodePacket, chunkify, Assembler, sha256Hex, makeCode, normalizeCode, formatCode,
  CODE_ALPHABET, validControl, formatBytes, CHUNK_SIZE, validThumb, validDim, sniffImage,
} from '../../js/core/protocol.js';

test('paquet binaire : aller-retour en-tête + charge utile', () => {
  const payload = new Uint8Array([1, 2, 3, 250, 0, 7]);
  const buf = encodePacket({ t: 'chunk', tid: 'tx-1', i: 3, n: 9, é: 'àé' }, payload);
  assert.ok(buf instanceof ArrayBuffer);
  const { header, payload: out } = decodePacket(buf);
  assert.deepEqual(header, { t: 'chunk', tid: 'tx-1', i: 3, n: 9, é: 'àé' });
  assert.deepEqual([...out], [...payload]);
});

test('paquet corrompu : erreur explicite', () => {
  assert.throws(() => decodePacket(new Uint8Array([1, 2])));
  const bad = new Uint8Array(8);
  new DataView(bad.buffer).setUint32(0, 9999, true);
  assert.throws(() => decodePacket(bad));
});

test('découpage + réassemblage dans le désordre, empreinte identique', async () => {
  const size = CHUNK_SIZE * 5 + 1234;
  const data = new Uint8Array(size);
  for (let i = 0; i < size; i++) data[i] = (i * 31 + 7) & 255;
  const chunks = chunkify(data);
  assert.equal(chunks.length, 6);
  const asm = new Assembler({ size, chunks: chunks.length });
  const order = [5, 2, 0, 4, 1, 3, 2];
  for (const i of order) asm.add(i, chunks[i].slice());
  assert.ok(asm.complete);
  assert.equal(asm.progress, 1);
  const out = asm.assemble();
  assert.equal(await sha256Hex(out), await sha256Hex(data));
});

test('réassemblage incomplet refusé, index invalide refusé', () => {
  const asm = new Assembler({ size: 10, chunks: 2 });
  asm.add(0, new Uint8Array(5));
  assert.equal(asm.complete, false);
  assert.ok(Math.abs(asm.progress - 0.5) < 1e-9);
  assert.throws(() => asm.assemble());
  assert.throws(() => asm.add(7, new Uint8Array(1)));
  assert.throws(() => asm.add(1.5, new Uint8Array(1)));
});

test('SHA-256 : vecteur de référence', async () => {
  assert.equal(await sha256Hex(new TextEncoder().encode('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('codes d’appairage : alphabet sans caractères ambigus', () => {
  assert.ok(!/[01OIL]/.test(CODE_ALPHABET));
  for (let i = 0; i < 200; i++) {
    const c = makeCode();
    assert.equal(c.length, 6);
    assert.equal(normalizeCode(c), c);
  }
  assert.equal(normalizeCode(' k7p-2qx '), 'K7P2QX');
  assert.equal(normalizeCode('K7P 2QX'), 'K7P2QX');
  assert.equal(normalizeCode('K7P2Q'), null);
  assert.equal(normalizeCode('K0P2QX'), null);
  assert.equal(normalizeCode(42), null);
  assert.equal(formatCode('K7P2QX'), 'K7P-2QX');
});

test('validation défensive des messages de contrôle', () => {
  assert.ok(validControl({ type: 'grab', tid: 'tx-1' }));
  assert.ok(!validControl({ type: 'eval', tid: 'tx-1' }));
  assert.ok(!validControl(null));
  assert.ok(!validControl({ type: 'grab', tid: 'x'.repeat(200) }));
});

test('tailles lisibles', () => {
  assert.equal(formatBytes(512), '512 o');
  assert.equal(formatBytes(2048), '2 Ko');
  assert.equal(formatBytes(1.5 * 1024 * 1024), '1,5 Mo');
});

test('réception : vignette, dimensions et type d’image validés strictement', () => {
  assert.ok(validThumb('data:image/jpeg;base64,/9j/4AAQSkZJRg=='));
  assert.ok(!validThumb('data:image/png;base64,AAAA"), url("/pirate.png'), 'pas d’injection CSS');
  assert.ok(!validThumb('data:image/svg+xml;base64,PHN2Zz4='), 'pas de SVG');
  assert.ok(!validThumb('javascript:alert(1)'));
  assert.ok(!validThumb('data:image/jpeg;base64,' + 'A'.repeat(200_000)));
  assert.equal(validDim(1600), 1600);
  for (const v of ['abc', '<b>x</b>', 0, -3, 1.5, 1e9, NaN, null]) assert.equal(validDim(v), null, String(v));
  assert.equal(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg');
  assert.equal(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png');
  assert.equal(sniffImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')), null);
  assert.equal(sniffImage(new TextEncoder().encode('bonjour')), null);
  assert.ok(validControl({ type: 'granted', tid: 'tx-1' }) && validControl({ type: 'denied', tid: 'tx-1' }));
});
