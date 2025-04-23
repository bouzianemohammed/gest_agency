import pandas as pd
from io import BytesIO

def process_excel(file):
    # Load the Excel file into a DataFrame
    df = pd.read_excel(file)
    df.columns = df.columns.str.strip()  # Strip whitespace from column names

    # Define required columns
    required_cols = ['Code', 'Référence', 'Intitule', 'Adresse', 'Tarif', 'CAE', 'Numéro', 'Etat Branchement']
    
    # Check for missing columns
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f'Missing columns: {", ".join(missing)}')

    # Clean up the 'Tarif' column
    df['Tarif'] = df['Tarif'].astype(str).str.strip()

    # Filter rows for electricity (Tarif values: 54M, 54NM, 52NM, 53M, 53NM)
    elec_df = df[df['Tarif'].isin(['54M', '54NM', '52NM', '53M', '53NM'])].copy()
    elec_df = elec_df[['Référence', 'Tarif', 'CAE', 'Numéro']]
    elec_df.columns = ['Référence', 'Tarif elec', 'CAE ELEC', 'NUM ELEC']

    # Filter rows for gas (Tarif values: 23M, 23NM)
    gaz_df = df[df['Tarif'].isin(['23M', '23NM'])].copy()
    gaz_df = gaz_df[['Référence', 'Tarif', 'CAE', 'Numéro']]
    gaz_df.columns = ['Référence', 'Tarif gaz', 'CAE GAZ', 'NUM GAZ']

    # Merge electricity and gas data on 'Référence'
    merged_df = pd.merge(elec_df, gaz_df, on='Référence', how='outer')

    # Get general information grouped by 'Référence'
    base_info = df.groupby('Référence').first().reset_index()
    base_info = base_info[['Code', 'Référence', 'Intitule', 'Adresse', 'Etat Branchement']]

    # Final merge with general info
    final_df = pd.merge(base_info, merged_df, on='Référence', how='left')

    # Reorder columns for the final output
    final_df = final_df[['Code', 'Référence', 'Intitule', 'Adresse',
                         'Tarif elec', 'Tarif gaz',
                         'CAE ELEC', 'CAE GAZ',
                         'NUM ELEC', 'NUM GAZ',
                         'Etat Branchement']]

    # Export the final DataFrame to an Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        final_df.to_excel(writer, index=False, sheet_name='Mise_A_Jour')

    output.seek(0)
    return output