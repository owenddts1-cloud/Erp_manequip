import openpyxl

wb = openpyxl.load_workbook(r"C:\Users\Manutenção\Downloads\FO-SGI-032 PLANEJAMENTO DE MANUTENCAO PREVENTIVA REV07 - 2026.xlsx", data_only=True)
sheet = wb['FO-SGI-032']

headers = [cell.value for cell in sheet[5]]
print("Headers:", headers)

count = 0
for r in range(6, sheet.max_row + 1):
    row_vals = [cell.value for cell in sheet[r]]
    # Check if there is an equipment name in column B (index 1)
    if row_vals[1]:
        count += 1
        # Print first few rows to verify
        if count <= 15:
            # Months from JAN to DEZ are columns H to S (index 7 to 18)
            months_schedule = {headers[col_idx]: row_vals[col_idx] for col_idx in range(7, 19) if row_vals[col_idx]}
            print(f"Row {r} - {row_vals[1]} (Patrimonio: {row_vals[2]}, Period: {row_vals[3]}): {months_schedule}")

print(f"\nTotal rows with equipment: {count}")
