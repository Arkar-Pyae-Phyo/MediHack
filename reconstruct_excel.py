import json
import io
import pandas as pd
import zipfile
import os

def reconstruct_excel_from_json(json_path, output_xlsx_path):
    """Try to reconstruct the Excel file from the corrupted JSON"""
    try:
        # Read the JSON file as raw bytes
        with open(json_path, 'rb') as f:
            raw_data = f.read()
        
        # Find the PK signature (Excel/ZIP file header)
        pk_signature = b'PK\x03\x04'
        pk_index = raw_data.find(pk_signature)
        
        if pk_index == -1:
            print(f"No PK signature found in {json_path}")
            return False
        
        # Extract everything from PK signature onwards  
        # Find the end of the ZIP file (look for end of central directory signature)
        eocd_signature = b'PK\x05\x06'
        eocd_index = raw_data.rfind(eocd_signature)
        
        if eocd_index == -1:
            # Try to find the last occurrence of any PK signature
            last_pk = raw_data.rfind(b'PK')
            if last_pk != -1:
                # Extract until end of file
                zip_data = raw_data[pk_index:]
            else:
                print(f"Could not find end of ZIP in {json_path}")
                return False
        else:
            # Extract ZIP data including EOCD (usually 22 bytes minimum, but could be longer)
            # We'll just take everything from first PK to end
            zip_data = raw_data[pk_index:]
        
        # Try to clean the data - remove JSON artifacts
        # Look for patterns that indicate Excel content boundaries
        zip_data_clean = []
        i = 0
        while i < len(zip_data):
            byte = zip_data[i]
            # Skip common JSON artifacts
            if byte in [ord('['), ord(']'), ord('{'), ord('}'), ord('"'), ord(','), ord('\n'), ord('\r'), ord(' ')] and i < 100:
                i += 1
                continue
            zip_data_clean.append(byte)
            i += 1
        
        zip_data = bytes(zip_data_clean)
        
        # Try to save and read as Excel
        with open(output_xlsx_path, 'wb') as f:
            f.write(zip_data)
        
        # Try to read it
        df = pd.read_excel(output_xlsx_path, engine='openpyxl')
        print(f"✓ Successfully reconstructed {output_xlsx_path}")
        print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")
        return True
        
    except Exception as e:
        print(f"✗ Failed to reconstruct {json_path}: {str(e)}")
        # Clean up failed file
        if os.path.exists(output_xlsx_path):
            os.remove(output_xlsx_path)
        return False

# Try to reconstruct all files
files = {
    'doc': 'sample_data/doc.json',
    'drug': 'sample_data/drug.json', 
    'lab': 'sample_data/lab.json',
    'nurse': 'sample_data/nurse.json',
    'xray': 'sample_data/xray.json'
}

success_count = 0
for file_type, json_path in files.items():
    xlsx_path = json_path.replace('.json', '.xlsx')
    if reconstruct_excel_from_json(json_path, xlsx_path):
        success_count += 1

print(f"\n{'='*80}")
print(f"Successfully reconstructed {success_count}/{len(files)} files")
