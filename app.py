from flask import Flask, request, send_file, jsonify, render_template
from mise_a_jour import process_excel as mise_a_jour_process
from gestion_coupure_logic import merge_files
import webbrowser
from datetime import datetime
import os
from pathlib import Path

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

# Route for "Mise à jour" file upload
@app.route('/update-reference', methods=['POST'])
def update_reference():
    try:
        file = request.files.get('file')
        if not file or file.filename == '':
            return jsonify({'error': 'No file uploaded'}), 400

        # Process the file using mise_a_jour.py
        output = mise_a_jour_process(file)
        
        # Ensure data directory exists
        data_dir = Path(__file__).parent / 'data'
        data_dir.mkdir(exist_ok=True)
        
        # Save the processed file for later use in merging
        output_path = data_dir / 'fichier_mise_a_jour.xlsx'
        with open(output_path, 'wb') as f:
            f.write(output.getbuffer())

        # Return the processed file as a download
        output.seek(0)
        return send_file(
            output,
            as_attachment=True,
            download_name='fichier_mise_a_jour.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route for "Gestion Coupure" file upload
@app.route('/process-creance', methods=['POST'])
def process_creance():
    try:
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files uploaded'}), 400

        # Check if reference file exists
        reference_file = Path(__file__).parent / 'data' / 'fichier_mise_a_jour.xlsx'
        if not reference_file.exists():
            return jsonify({'error': 'Reference file missing. Please process a reference file first using "Mise à jour".'}), 400

        # Process the first uploaded file
        merged_output = merge_files(files[0])  # Pass the file object directly

        # Generate a unique filename with the current date
        current_date = datetime.now().strftime('%Y-%m-%d')
        output_filename = f'resultat_gestion_coupure_{current_date}.xlsx'

        # Return the merged file as a download
        return send_file(
            merged_output,
            as_attachment=True,
            download_name=output_filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Try to open in Chrome first, fallback to default browser
    chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe %s"
    try:
        webbrowser.get(chrome_path).open("http://127.0.0.1:5000")
    except:
        webbrowser.open("http://127.0.0.1:5000")

    # Create data directory if it doesn't exist
    data_dir = Path(__file__).parent / 'data'
    data_dir.mkdir(exist_ok=True)

    app.run(debug=True)