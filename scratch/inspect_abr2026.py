import openpyxl

wb = openpyxl.load_workbook(r"C:\Users\Manutenção\Downloads\PREVENTIVAS.xlsx", data_only=True)
sheet = wb['ABR2026']

headers = [cell.value for cell in sheet[1]]
print("Headers:", headers)

for r in range(2, sheet.max_row + 1):
    row_vals = [cell.value for cell in sheet[r]]
    if not any(row_vals):
        continue
    # Look for any non-null value in daily columns (index 7 to 37)
    daily_vals = []
    for col_idx in range(7, 38):
        if col_idx < len(row_vals) and row_vals[col_idx] is not None:
            daily_vals.append((headers[col_idx], row_vals[col_idx]))
    if daily_vals:
        print(f"Row {r} ({row_vals[2]}): {daily_vals} | Status: {row_vals[0]}")
