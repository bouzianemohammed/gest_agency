import pandas as pd
from io import BytesIO
from pathlib import Path
import os

def merge_files(second_file):
    try:
        # Load the reference file (mise à jour)
        first_file_path = Path(os.path.dirname(__file__)) / 'data' / 'fichier_mise_a_jour.xlsx'
        if not first_file_path.exists():
            raise FileNotFoundError("Reference file missing. Please run 'Mise à jour' first.")

        reference_df = pd.read_excel(first_file_path)

        # Load the creance file (second file)
        creance_df = pd.read_excel(second_file)

        # Standardize column names
        if 'Referance' in creance_df.columns:
            creance_df = creance_df.rename(columns={'Referance': 'Référence'})
        if 'Montant' not in creance_df.columns:
            raise ValueError("Creance file must contain 'Montant' column")

        # Calculate metrics (only for references that exist in creance file)
        metrics_df = creance_df.groupby('Référence').agg(
            **{
                'nbr fct': ('Référence', 'count'),  # Count of references
                'mtt': ('Montant', 'sum')           # Sum of Montant
            }
        ).reset_index()

        # Merge with reference data - INNER JOIN to only keep matching references
        merged_df = pd.merge(
            reference_df,
            metrics_df,
            on='Référence',
            how='inner'  # Changed from 'left' to 'inner' to only keep matches
        )

        # Fill NA values (though shouldn't be needed with inner join)
        merged_df['nbr fct'] = merged_df['nbr fct'].fillna(0).astype(int)
        merged_df['mtt'] = merged_df['mtt'].fillna(0)

        # Select and order final columns
        final_columns = [
            'Code', 'Référence', 'Intitule', 'Adresse',
            'NUM ELEC', 'NUM GAZ', 'nbr fct', 'mtt'
        ]
        
        # Ensure all columns exist
        for col in final_columns:
            if col not in merged_df.columns:
                merged_df[col] = '' if col in ['NUM ELEC', 'NUM GAZ'] else 0

        merged_df = merged_df[final_columns]

        # Export to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            merged_df.to_excel(writer, index=False, sheet_name='Resultat')
        
        output.seek(0)
        return output

    except Exception as e:
        print(f"Error during merging: {e}")
        raise