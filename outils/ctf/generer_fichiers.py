#!/usr/bin/env python3
"""Génère les fichiers binaires des défis (images avec EXIF, stéganographie, son) dans assets/ctf/fichiers/.

Dépendances : pip install pillow piexif numpy
Usage : python3 outils/ctf/generer_fichiers.py
Ce script contient les réponses en clair : il reste dans outils/, qui n'est jamais publié.
"""
import io
import math
import os
import random
import struct
import wave
import zipfile

import numpy as np
import piexif
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.normpath(os.path.join(ICI, '..', '..', 'assets', 'ctf', 'fichiers'))
PHOTOS = os.path.normpath(os.path.join(ICI, '..', '..', 'assets', 'ctf', 'photos'))
os.makedirs(SORTIE, exist_ok=True)

POLICES = ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']
POLICE_MAIN = ['/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'] + POLICES


def police(taille, liste=POLICES):
    for p in liste:
        if os.path.exists(p):
            return ImageFont.truetype(p, taille)
    return ImageFont.load_default()


def chemin(nom):
    return os.path.join(SORTIE, nom)


def degrade(w, h, haut, bas):
    a = np.linspace(0, 1, h)[:, None, None]
    img = (np.array(haut)[None, None, :] * (1 - a) + np.array(bas)[None, None, :] * a)
    return Image.fromarray(np.repeat(img, w, axis=1).astype('uint8'), 'RGB')


def rationnel(x):
    return (int(round(x * 10000)), 10000)


def dms(v):
    v = abs(v)
    d = int(v)
    m = int((v - d) * 60)
    s = (v - d - m / 60) * 3600
    return ((d, 1), (m, 1), (int(round(s * 100)), 100))


def exif_octets(zeroth=None, exif=None, gps=None, vignette=None):
    d = {'0th': zeroth or {}, 'Exif': exif or {}, 'GPS': gps or {}, '1st': {}, 'thumbnail': None}
    if vignette is not None:
        d['1st'] = {piexif.ImageIFD.Compression: 6, piexif.ImageIFD.XResolution: (72, 1), piexif.ImageIFD.YResolution: (72, 1), piexif.ImageIFD.ResolutionUnit: 2}
        d['thumbnail'] = vignette
    return piexif.dump(d)


def jpeg(img, q=86):
    b = io.BytesIO()
    img.save(b, 'JPEG', quality=q, optimize=True)
    return b.getvalue()


def sauver_jpeg(img, nom, exif=None, q=86):
    b = io.BytesIO()
    if exif:
        img.save(b, 'JPEG', quality=q, optimize=True, exif=exif)
    else:
        img.save(b, 'JPEG', quality=q, optimize=True)
    with open(nom, 'wb') as f:
        f.write(b.getvalue())
    return b.getvalue()


# ---------- illustrations ----------
def terrasse(w=1280, h=853):
    rnd = random.Random(3)
    img = degrade(w, h, (250, 214, 165), (236, 188, 140))
    d = ImageDraw.Draw(img)
    # façade de brique
    d.rectangle([0, 0, w, int(h * 0.62)], fill=(196, 104, 80))
    for y in range(0, int(h * 0.62), 18):
        off = 0 if (y // 18) % 2 == 0 else 22
        for x in range(-44 + off, w, 44):
            d.rectangle([x + 2, y + 2, x + 42, y + 16], fill=(205 + rnd.randint(-12, 12), 112 + rnd.randint(-10, 10), 86 + rnd.randint(-8, 8)))
    # vitrine
    d.rectangle([140, 150, 1140, 520], fill=(44, 52, 60))
    for x in range(160, 1140, 200):
        d.rectangle([x, 170, x + 180, 500], fill=(70, 86, 96))
        d.line([x + 20, 190, x + 120, 300], fill=(120, 140, 150), width=3)
    # store rayé
    for i, x in enumerate(range(100, 1180, 60)):
        d.polygon([(x, 90), (x + 60, 90), (x + 70, 170), (x + 10, 170)], fill=(28, 92, 70) if i % 2 == 0 else (240, 236, 222))
    d.rectangle([90, 70, 1190, 92], fill=(22, 70, 54))
    d.text((480, 72), 'CAFÉ DES ARCADES', font=police(20), fill=(240, 236, 222))
    # sol, tables, chaises
    d.rectangle([0, int(h * 0.62), w, h], fill=(186, 170, 150))
    for x in range(0, w, 80):
        d.line([x, int(h * 0.62), x - 200, h], fill=(170, 154, 134), width=2)
    for cx in (260, 640, 1020):
        d.ellipse([cx - 90, 600, cx + 90, 640], fill=(70, 70, 76))
        d.rectangle([cx - 6, 620, cx + 6, 760], fill=(60, 60, 66))
        d.ellipse([cx - 50, 750, cx + 50, 770], fill=(60, 60, 66))
        d.ellipse([cx - 22, 588, cx + 4, 610], fill=(250, 250, 250))
        d.ellipse([cx + 20, 592, cx + 44, 612], fill=(250, 250, 250))
        for s in (-150, 150):
            d.rectangle([cx + s - 30, 640, cx + s + 30, 700], fill=(120, 72, 40))
            d.rectangle([cx + s - 30, 700, cx + s - 24, 790], fill=(90, 54, 30))
            d.rectangle([cx + s + 24, 700, cx + s + 30, 790], fill=(90, 54, 30))
    # plantes
    for x in (40, 1200):
        d.rectangle([x, 640, x + 60, 720], fill=(150, 90, 60))
        for k in range(14):
            a = k / 14 * math.pi
            d.ellipse([x + 30 + math.cos(a) * 60 - 18, 600 - math.sin(a) * 70 - 10, x + 30 + math.cos(a) * 60 + 18, 600 - math.sin(a) * 70 + 10], fill=(46, 120, 66))
    return img.filter(ImageFilter.GaussianBlur(0.6))


def panorama_mer(w=1280, h=800):
    img = degrade(w, h, (126, 182, 230), (246, 220, 190))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 470, w, h], fill=(36, 102, 150))
    for y in range(480, h, 14):
        d.line([0, y, w, y + 6], fill=(56, 124, 170), width=2)
    # îles au large
    d.polygon([(860, 470), (920, 430), (990, 445), (1060, 470)], fill=(120, 130, 120))
    d.polygon([(1080, 470), (1120, 452), (1170, 470)], fill=(130, 138, 128))
    # toits et collines au premier plan
    d.polygon([(0, 560), (180, 520), (420, 540), (640, 500), (900, 560), (1280, 520), (1280, 800), (0, 800)], fill=(200, 180, 150))
    rnd = random.Random(8)
    for i in range(70):
        x = rnd.randint(0, w)
        y = rnd.randint(560, 790)
        ww = rnd.randint(40, 90)
        d.rectangle([x, y, x + ww, y + 40], fill=(232, 222, 200))
        d.polygon([(x - 4, y), (x + ww // 2, y - 22), (x + ww + 4, y)], fill=(196, 96, 60))
    # balustrade
    d.rectangle([0, 740, w, 760], fill=(220, 210, 190))
    for x in range(0, w, 48):
        d.rectangle([x + 14, 760, x + 30, 800], fill=(210, 200, 180))
    return img


def feu_artifice(w=1280, h=853):
    img = degrade(w, h, (8, 10, 32), (30, 24, 70))
    d = ImageDraw.Draw(img)
    rnd = random.Random(14)
    for cx, cy, col in ((340, 260, (255, 90, 120)), (760, 200, (120, 210, 255)), (1020, 330, (255, 220, 90)), (560, 380, (160, 255, 160))):
        for k in range(48):
            a = k / 48 * 2 * math.pi
            r = rnd.randint(90, 150)
            d.line([cx, cy, cx + math.cos(a) * r, cy + math.sin(a) * r], fill=col, width=2)
            d.ellipse([cx + math.cos(a) * r - 3, cy + math.sin(a) * r - 3, cx + math.cos(a) * r + 3, cy + math.sin(a) * r + 3], fill=(255, 255, 255))
    # pont et ville
    d.rectangle([0, 660, w, h], fill=(12, 16, 30))
    for x in range(0, w, 160):
        d.arc([x, 600, x + 160, 760], 180, 360, fill=(200, 140, 110), width=10)
    d.rectangle([0, 600, w, 618], fill=(190, 130, 100))
    for i in range(40):
        x = rnd.randint(0, w)
        d.rectangle([x, 560 - rnd.randint(0, 60), x + 30, 600], fill=(20, 24, 40))
    return img.filter(ImageFilter.GaussianBlur(0.8))


def bureau_postit(w=1600, h=1200):
    img = degrade(w, h, (232, 226, 214), (210, 200, 186))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 760, w, h], fill=(150, 104, 70))
    # écran
    d.rounded_rectangle([780, 160, 1460, 620], 18, fill=(30, 34, 44))
    d.rectangle([810, 190, 1430, 590], fill=(60, 110, 160))
    d.rectangle([1080, 620, 1160, 740], fill=(60, 60, 66))
    d.rectangle([980, 730, 1260, 760], fill=(60, 60, 66))
    # plante
    d.rectangle([1340, 640, 1440, 780], fill=(190, 110, 70))
    for k in range(18):
        a = k / 18 * math.pi
        d.ellipse([1390 + math.cos(a) * 90 - 26, 600 - math.sin(a) * 110 - 12, 1390 + math.cos(a) * 90 + 26, 600 - math.sin(a) * 110 + 12], fill=(56, 132, 72))
    # tasse
    d.rounded_rectangle([600, 680, 700, 790], 12, fill=(240, 240, 240))
    d.arc([680, 700, 740, 760], -90, 90, fill=(240, 240, 240), width=12)
    # post-it à gauche (sera recadré)
    d.polygon([(90, 170), (690, 140), (720, 640), (120, 680)], fill=(255, 228, 92))
    f = police(58)
    d.text((140, 260), 'Code d\'accès :', font=f, fill=(40, 40, 60))
    d.text((130, 385), 'LUMIO{la_miniature', font=police(48), fill=(180, 20, 40))
    d.text((150, 465), '_se_souvient}', font=police(48), fill=(180, 20, 40))
    d.text((160, 570), '— ne pas jeter', font=police(40), fill=(40, 40, 60))
    return img


def photo_skate(w=1280, h=853):
    img = degrade(w, h, (170, 205, 235), (238, 232, 220))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 520, w, h], fill=(150, 150, 156))
    d.polygon([(200, 700), (520, 520), (840, 520), (1100, 700)], fill=(175, 175, 182))
    d.arc([380, 420, 900, 760], 200, 340, fill=(90, 90, 98), width=14)
    # silhouettes
    for x, c in ((420, (230, 80, 70)), (760, (60, 110, 200)), (980, (240, 170, 40))):
        d.ellipse([x - 22, 380, x + 22, 424], fill=(70, 50, 40))
        d.rectangle([x - 26, 424, x + 26, 520], fill=c)
        d.line([x - 14, 520, x - 30, 610], fill=(40, 40, 50), width=14)
        d.line([x + 14, 520, x + 30, 610], fill=(40, 40, 50), width=14)
        d.rounded_rectangle([x - 60, 610, x + 60, 626], 8, fill=(30, 30, 30))
    d.text((40, 40), 'Rassemblement du skatepark — samedi', font=police(30), fill=(40, 40, 60))
    return img


def affiche_sombre(w=1000, h=1400, cache=None):
    fond = (26, 29, 36)
    img = Image.new('RGB', (w, h), fond)
    d = ImageDraw.Draw(img)
    d.rectangle([60, 60, w - 60, h - 60], outline=(60, 66, 80), width=4)
    d.text((110, 140), 'RIEN À VOIR', font=police(110), fill=(220, 224, 236))
    d.text((110, 270), 'ICI', font=police(110), fill=(220, 224, 236))
    d.text((110, 1220), 'Exposition « Nuit noire » — galerie fictive', font=police(30), fill=(140, 146, 160))
    if cache:
        dc = ImageDraw.Draw(img)
        y = 560
        for ligne in cache:
            dc.text((110, y), ligne, font=police(78), fill=(fond[0] + 1, fond[1], fond[2]))
            y += 110
    return img


def robot(w=900, h=640):
    img = degrade(w, h, (40, 44, 80), (90, 60, 120))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([300, 140, 600, 420], 40, fill=(200, 210, 230))
    d.ellipse([360, 220, 420, 280], fill=(40, 200, 160))
    d.ellipse([480, 220, 540, 280], fill=(40, 200, 160))
    d.rounded_rectangle([380, 330, 520, 360], 10, fill=(60, 70, 100))
    d.line([450, 140, 450, 90], fill=(200, 210, 230), width=8)
    d.ellipse([436, 70, 464, 98], fill=(255, 120, 120))
    d.rounded_rectangle([340, 430, 560, 600], 24, fill=(170, 180, 205))
    d.text((40, 30), 'Mascotte du club de robotique', font=police(28), fill=(240, 240, 255))
    return img


def note_manuscrite(w=1000, h=700):
    img = Image.new('RGB', (w, h), (250, 248, 240))
    d = ImageDraw.Draw(img)
    for y in range(90, h, 46):
        d.line([0, y, w, y], fill=(190, 210, 235), width=2)
    d.line([90, 0, 90, h], fill=(240, 150, 150), width=3)
    f = police(44, POLICE_MAIN)
    d.text((120, 110), 'Rapport final — version brouillon', font=f, fill=(30, 40, 90))
    d.text((120, 220), 'Si tu lis ceci, tu as compris', font=police(38, POLICE_MAIN), fill=(30, 40, 90))
    d.text((120, 280), 'que ce n\'était pas un PDF.', font=police(38, POLICE_MAIN), fill=(30, 40, 90))
    d.text((120, 400), 'LUMIO{les_extensions_mentent}', font=police(46), fill=(190, 30, 50))
    return img.rotate(-1.2, fillcolor=(250, 248, 240))


def tour_eiffel(w=1200, h=900):
    img = degrade(w, h, (40, 52, 110), (250, 170, 120))
    d = ImageDraw.Draw(img)
    cx, base, top = 600, 820, 90
    col = (30, 26, 40)
    d.polygon([(cx - 260, base), (cx - 120, 560), (cx - 70, 560), (cx - 150, base)], fill=col)
    d.polygon([(cx + 260, base), (cx + 120, 560), (cx + 70, 560), (cx + 150, base)], fill=col)
    d.arc([cx - 160, 640, cx + 160, 900], 180, 360, fill=col, width=28)
    d.rectangle([cx - 140, 540, cx + 140, 566], fill=col)
    d.polygon([(cx - 120, 540), (cx - 40, 330), (cx + 40, 330), (cx + 120, 540)], fill=col)
    d.rectangle([cx - 60, 318, cx + 60, 336], fill=col)
    d.polygon([(cx - 40, 318), (cx - 8, top + 30), (cx + 8, top + 30), (cx + 40, 318)], fill=col)
    d.rectangle([cx - 4, top - 10, cx + 4, top + 30], fill=col)
    d.rectangle([0, base, w, h], fill=(36, 70, 50))
    for x in range(0, w, 30):
        d.ellipse([x - 20, base - 30, x + 30, base + 10], fill=(40, 84, 56))
    return img.filter(ImageFilter.GaussianBlur(0.5))


# ---------- fichiers ----------
def exif_appareil():
    z = {piexif.ImageIFD.Make: b'FUJIFILM', piexif.ImageIFD.Model: b'X-T30', piexif.ImageIFD.Software: b'Digital Camera X-T30 Ver2.00', piexif.ImageIFD.DateTime: b'2024:05:18 10:42:31', piexif.ImageIFD.Orientation: 1}
    e = {piexif.ExifIFD.DateTimeOriginal: b'2024:05:18 10:42:31', piexif.ExifIFD.ExposureTime: (1, 500), piexif.ExifIFD.FNumber: (56, 10), piexif.ExifIFD.ISOSpeedRatings: 200, piexif.ExifIFD.FocalLength: (230, 10), piexif.ExifIFD.LensMake: b'FUJIFILM', piexif.ExifIFD.LensModel: b'XF23mmF2 R WR'}
    sauver_jpeg(terrasse(), chemin('terrasse.jpg'), exif_octets(z, e))


def exif_gps():
    lat, lon = 43.2839, 5.3712
    z = {piexif.ImageIFD.Make: b'Apple', piexif.ImageIFD.Model: b'iPhone 13', piexif.ImageIFD.Software: b'17.4.1', piexif.ImageIFD.DateTime: b'2024:08:02 19:12:05'}
    e = {piexif.ExifIFD.DateTimeOriginal: b'2024:08:02 19:12:05', piexif.ExifIFD.OffsetTimeOriginal: b'+02:00', piexif.ExifIFD.LensModel: b'iPhone 13 back dual wide camera 5.1mm f/1.6'}
    g = {piexif.GPSIFD.GPSLatitudeRef: b'N', piexif.GPSIFD.GPSLatitude: dms(lat), piexif.GPSIFD.GPSLongitudeRef: b'E', piexif.GPSIFD.GPSLongitude: dms(lon),
         piexif.GPSIFD.GPSAltitudeRef: 0, piexif.GPSIFD.GPSAltitude: (149, 1), piexif.GPSIFD.GPSImgDirectionRef: b'T', piexif.GPSIFD.GPSImgDirection: (2405, 10)}
    sauver_jpeg(panorama_mer(), chemin('vue-mer.jpg'), exif_octets(z, e, g))


def exif_date():
    z = {piexif.ImageIFD.Make: b'Canon', piexif.ImageIFD.Model: b'Canon EOS 250D', piexif.ImageIFD.Software: b'GIMP 2.10.36', piexif.ImageIFD.DateTime: b'2024:01:03 10:12:44'}
    e = {piexif.ExifIFD.DateTimeOriginal: b'2023:07:14 22:47:13', piexif.ExifIFD.DateTimeDigitized: b'2023:07:14 22:47:13', piexif.ExifIFD.OffsetTimeOriginal: b'+02:00', piexif.ExifIFD.ExposureTime: (2, 1), piexif.ExifIFD.FNumber: (80, 10), piexif.ExifIFD.ISOSpeedRatings: 100}
    sauver_jpeg(feu_artifice(), chemin('feu-artifice.jpg'), exif_octets(z, e))


def exif_miniature():
    orig = bureau_postit()
    vignette = orig.resize((320, 240), Image.LANCZOS)
    recadree = orig.crop((760, 120, 1600, 1200)).resize((672, 864), Image.LANCZOS)
    z = {piexif.ImageIFD.Make: b'SONY', piexif.ImageIFD.Model: b'ILCE-6400', piexif.ImageIFD.Software: b'Adobe Photoshop Lightroom Classic 13.2', piexif.ImageIFD.DateTime: b'2024:11:05 09:30:12'}
    e = {piexif.ExifIFD.DateTimeOriginal: b'2024:11:04 17:05:40'}
    sauver_jpeg(recadree, chemin('bureau.jpg'), exif_octets(z, e, vignette=jpeg(vignette, 80)))


def exif_auteur():
    z = {piexif.ImageIFD.Make: b'NIKON CORPORATION', piexif.ImageIFD.Model: b'NIKON Z 50', piexif.ImageIFD.Software: b'Ver.02.40', piexif.ImageIFD.DateTime: b'2025:02:22 15:03:10',
         piexif.ImageIFD.Artist: b'', piexif.ImageIFD.Copyright: b'', piexif.ImageIFD.XPComment: 'Envoyé depuis le portable de Mathis'.encode('utf-16le') + b'\x00\x00'}
    e = {piexif.ExifIFD.DateTimeOriginal: b'2025:02:22 15:03:10', piexif.ExifIFD.CameraOwnerName: b'Mathis Roques', piexif.ExifIFD.BodySerialNumber: b'6014829'}
    sauver_jpeg(photo_skate(), chemin('skatepark.jpg'), exif_octets(z, e))


def steg_strings():
    data = jpeg(robot(), 88)
    commentaire = b'Fichier de travail - ne pas diffuser. Mot de passe de la borne Wi-Fi du club : LUMIO{strings_lit_ce_que_tu_ne_vois_pas}'
    seg = b'\xff\xfe' + struct.pack('>H', len(commentaire) + 2) + commentaire
    with open(chemin('mascotte.jpg'), 'wb') as f:
        f.write(data[:2] + seg + data[2:])


def steg_lsb():
    img = degrade(800, 500, (24, 36, 70), (110, 60, 130))
    d = ImageDraw.Draw(img)
    for i in range(9):
        d.ellipse([60 + i * 80, 330 - (i % 3) * 40, 140 + i * 80, 410 - (i % 3) * 40], fill=(240, 200 - i * 12, 90 + i * 15))
    d.text((60, 60), 'Coucher de soleil sur la Garonne', font=police(34), fill=(255, 240, 220))
    d.text((60, 110), '(dessin de démonstration)', font=police(22), fill=(220, 210, 240))
    a = np.array(img).astype(np.uint8)
    message = 'Message caché pour l\'équipe : LUMIO{les_bits_de_poids_faible}'.encode('utf-8') + b'\x00'
    bits = []
    for octet in message:
        bits.extend((octet >> (7 - k)) & 1 for k in range(8))
    plat = a.reshape(-1)  # ordre R, G, B, R, G, B… pixel par pixel
    plat[:len(bits)] = (plat[:len(bits)] & 0xFE) | np.array(bits, dtype=np.uint8)
    Image.fromarray(plat.reshape(a.shape), 'RGB').save(chemin('coucher-soleil.png'), optimize=True)


def steg_zip():
    base = jpeg(terrasse(960, 640), 84)
    z = io.BytesIO()
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('secret/message.txt', 'Bravo ! Une archive ZIP collée après la fin d\'une image passe inaperçue.\nFlag : LUMIO{un_zip_colle_apres_la_fin}\n')
        zf.writestr('secret/liste-courses.txt', 'pain, fromage, olives\n')
    with open(chemin('carte-postale.jpg'), 'wb') as f:
        f.write(base + z.getvalue())


def steg_spectre():
    texte = 'LUMIO{ECOUTE_AVEC_LES_YEUX}'
    f = police(30)
    larg = int(f.getlength(texte)) + 20
    bm = Image.new('L', (larg, 40), 0)
    ImageDraw.Draw(bm).text((10, 2), texte, font=f, fill=255)
    bm = np.array(bm).astype(float) / 255.0
    hauteur, largeur = bm.shape
    fe, duree = 22050, 9.0
    n = int(fe * duree)
    t = np.arange(n) / fe
    debut, fin = 0.6, duree - 0.6
    col = np.clip(((t - debut) / (fin - debut) * largeur).astype(int), 0, largeur - 1)
    actif = ((t >= debut) & (t <= fin)).astype(float)
    freqs = np.linspace(9000, 2500, hauteur)
    s = np.zeros(n)
    for r in range(hauteur):
        if bm[r].max() < 0.2:
            continue
        amp = bm[r][col] * actif
        s += amp * np.sin(2 * np.pi * freqs[r] * t + r)
    s /= max(1e-9, np.abs(s).max())
    s *= 0.35
    # fond musical : accords doux et léger bruit
    for k, fq in enumerate((196.0, 246.9, 293.7, 392.0)):
        s += 0.08 * np.sin(2 * np.pi * fq * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t + k))
    s += np.random.default_rng(5).normal(0, 0.01, n)
    s = np.clip(s / np.abs(s).max() * 0.9, -1, 1)
    with wave.open(chemin('message-du-phare.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(fe)
        w.writeframes((s * 32767).astype('<i2').tobytes())


def steg_invisible():
    affiche_sombre(cache=['LUMIO{presque', '_invisible}']).save(chemin('affiche-nuit-noire.png'), optimize=True)


def foren_signature():
    b = io.BytesIO()
    note_manuscrite().save(b, 'PNG', optimize=True)
    with open(chemin('rapport_final.pdf'), 'wb') as f:
        f.write(b.getvalue())


def photo_exemple():
    os.makedirs(PHOTOS, exist_ok=True)
    tour_eiffel().save(os.path.join(PHOTOS, 'exemple-crepuscule.jpg'), 'JPEG', quality=84, optimize=True)


if __name__ == '__main__':
    for fn in (exif_appareil, exif_gps, exif_date, exif_miniature, exif_auteur, steg_strings, steg_lsb, steg_zip, steg_spectre, steg_invisible, foren_signature, photo_exemple):
        fn()
        print('ok', fn.__name__)
    for n in sorted(os.listdir(SORTIE)):
        print(f'{n:28s} {os.path.getsize(chemin(n)) / 1024:7.1f} Ko')
