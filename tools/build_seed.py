"""Genera backend/Seed.gs a partir del libro de catálogos de la Fase 2.

Uso: python3 tools/build_seed.py <catalogos.xlsx> backend/Seed.gs
Las hojas de catálogo tienen los encabezados en la fila 1, o en la fila 3 cuando la fila 1 es una nota.
"""
import json
import sys
import unicodedata

import openpyxl

SHEETS = ['CAT_Plantas', 'CAT_EsquemasTurno', 'CAT_Servicios', 'CAT_ServicioEsquema', 'CAT_ComedorCompartido',
          'CAT_Puestos', 'CAT_TurnosConcesionario', 'CAT_PlantillaRequerida', 'CAT_Categorias', 'CAT_Criterios',
          'CAT_TiposIncidencia', 'AUD_Secciones', 'AUD_Puntos', 'IND_Indicadores']


RENAME = {'criterio_s': 'criterios', 'campos_especificos_ademas_de_los_comunes': 'campos_especificos',
          'punto_a_verificar': 'texto', 'turno_esquema_original': 'turno_esquema', 'tratamiento_de_faltantes': 'tratamiento_faltantes'}


def norm(h):
    h = unicodedata.normalize('NFKD', str(h)).encode('ascii', 'ignore').decode().lower()
    out = ''.join(c if c.isalnum() else '_' for c in h)
    while '__' in out:
        out = out.replace('__', '_')
    out = out.strip('_')
    return RENAME.get(out, out)


def main(src, dst):
    wb = openpyxl.load_workbook(src, data_only=True)
    seed = {}
    for name in SHEETS:
        ws = wb[name]
        rows = list(ws.iter_rows(values_only=True))
        start = 0 if rows[0][1] is not None else 2
        headers = [norm(h) for h in rows[start] if h is not None]
        data = []
        for r in rows[start + 1:]:
            if r[0] is None:
                continue
            data.append(['' if v is None else str(v) for v in r[:len(headers)]])
        if name == 'CAT_ComedorCompartido':
            headers = ['comedor_compartido_id'] + headers
            data = [[f'CCO-{i:02d}'] + r for i, r in enumerate(data, 1)]
        if name == 'CAT_ServicioEsquema':
            headers = ['servicio_esquema_id'] + headers
            data = [[f'SES-{i:03d}'] + r for i, r in enumerate(data, 1)]
        seed[name] = {'headers': headers, 'rows': data}
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('/** GENERADO por tools/build_seed.py desde el libro de catálogos de la Fase 2. No editar a mano. */\n')
        f.write('var SEED = ' + json.dumps(seed, ensure_ascii=False, indent=1) + ';\n')
    print({k: len(v['rows']) for k, v in seed.items()})


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
