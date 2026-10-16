# -*- coding: utf-8 -*-
"""
Genera variantes WebP livianas (600 y 1200 px de ancho) de las fotos que viven
en src/tienda/publico/imagenes/{productos,artesanos}/ y las deja en
src/tienda/publico/imagenes/web/<carpeta>-<nombre>-<ancho>.webp.

La tienda las usa automaticamente (ver optimizar() en src/imagenes/cloudinary.js);
los originales NO se tocan, porque las URLs guardadas en la base de datos
apuntan a ellos. Volver a ejecutar cuando se agreguen fotos nuevas:

    python scripts/optimizar-imagenes.py
"""
import os
from PIL import Image

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'tienda', 'publico', 'imagenes')
SALIDA = os.path.join(RAIZ, 'web')
ANCHOS = (600, 1200)
os.makedirs(SALIDA, exist_ok=True)

total_antes = total_despues = 0
for carpeta in ('productos', 'artesanos'):
    origen = os.path.join(RAIZ, carpeta)
    for archivo in sorted(os.listdir(origen)):
        nombre, ext = os.path.splitext(archivo)
        if ext.lower() not in ('.jpg', '.jpeg', '.png'):
            continue
        ruta = os.path.join(origen, archivo)
        im = Image.open(ruta).convert('RGB')
        total_antes += os.path.getsize(ruta)
        for ancho in ANCHOS:
            v = im.copy()
            if v.width > ancho:
                v = v.resize((ancho, round(v.height * ancho / v.width)), Image.LANCZOS)
            destino = os.path.join(SALIDA, f'{carpeta}-{nombre}-{ancho}.webp')
            v.save(destino, 'WEBP', quality=80, method=6)
            if ancho == ANCHOS[-1]:
                total_despues += os.path.getsize(destino)
        print(f'{carpeta}/{archivo}')
print(f'Originales: {total_antes // 1024} KB  ->  variantes de {ANCHOS[-1]} px: {total_despues // 1024} KB')
