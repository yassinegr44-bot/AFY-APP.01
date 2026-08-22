with open("src/utils/pdf.ts", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "{ content: 'Sexe / Genre :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } }," in line:
        lines.insert(i, "        [\n          { content: 'CIN :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },\n          { content: record.cin || 'Non renseigné', styles: { textColor: COLOR_DARK_TEXT } },\n          { content: 'Date de naissance :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },\n          { content: record.dob ? format(record.dob.toDate(), 'dd/MM/yyyy') : 'Non renseignée', styles: { textColor: COLOR_DARK_TEXT } }\n        ],\n")
        break

with open("src/utils/pdf.ts", "w") as f:
    f.writelines(lines)
