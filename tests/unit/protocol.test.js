import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodePacket, decodePacket, chunkify, Assembler, sha256Hex, makeCode, normalizeCode, formatCode,
  CODE_ALPHABET, validControl, formatBytes, CHUNK_SIZE,
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
