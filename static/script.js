document.addEventListener("DOMContentLoaded", function() {
    let activeSection = null;
    let activeSidebar = null;

    // Toggle Mise à jour section
    window.toggleMiseAJour = function() {
        toggleSection('mise-a-jour');
    };

    // Toggle Gestion Coupure section
    window.toggleGestionCoupure = function() {
        // First close the sidebar
        if (activeSidebar) {
            document.getElementById(`sidebar-${activeSidebar}`).classList.remove('active');
            document.querySelector('.content').classList.remove('with-sidebar');
            activeSidebar = null;
        }
        // Then toggle the section
        toggleSection('gestion-coupure');
    };

    // Generic section toggle function
    function toggleSection(sectionId) {
        const section = document.getElementById(`${sectionId}-section`);
        const welcomeSection = document.getElementById('welcome-section');

        if (section.style.display === 'block') {
            // Hide if currently visible
            section.style.display = 'none';
            welcomeSection.style.display = 'block';
            activeSection = null;
        } else {
            // Show if currently hidden
            // First hide any other sections
            document.querySelectorAll('.section-container').forEach(sec => {
                sec.style.display = 'none';
            });
            
            // Hide welcome message
            welcomeSection.style.display = 'none';
            
            // Show requested section
            section.style.display = 'block';
            activeSection = sectionId;
        }
    }

    // Toggle sidebar visibility
    window.toggleSidebar = function(sidebarId) {
        // Hide any active section when opening a sidebar
        if (activeSection) {
            document.getElementById(`${activeSection}-section`).style.display = 'none';
            document.getElementById('welcome-section').style.display = 'block';
            activeSection = null;
        }
        
        // Toggle sidebar
        if (activeSidebar === sidebarId) {
            document.getElementById(`sidebar-${sidebarId}`).classList.remove('active');
            document.querySelector('.content').classList.remove('with-sidebar');
            activeSidebar = null;
        } else {
            // Hide all sidebars first
            document.querySelectorAll('.sidebar').forEach(sidebar => {
                sidebar.classList.remove('active');
            });
            
            // Show clicked sidebar
            const sidebar = document.getElementById(`sidebar-${sidebarId}`);
            sidebar.classList.add('active');
            document.querySelector('.content').classList.add('with-sidebar');
            activeSidebar = sidebarId;
        }
    };

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.sidebar') && !e.target.closest('.nav-links a')) {
            document.querySelectorAll('.sidebar').forEach(sidebar => {
                sidebar.classList.remove('active');
            });
            document.querySelector('.content').classList.remove('with-sidebar');
            activeSidebar = null;
        }
    });

    // Form handling
    const forms = document.querySelectorAll("form");
    forms.forEach(form => {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const form = this;
            const button = form.querySelector('.btn-process');
            const buttonText = button.querySelector('.btn-text');
            const spinner = button.querySelector('.spinner');
            const progressFill = form.querySelector('.progress-fill');
            const statusMessage = form.querySelector('.status-message');
            
            // Start loading state
            button.disabled = true;
            buttonText.textContent = 'Traitement en cours...';
            spinner.classList.remove('hidden');
            progressFill.style.width = '0%';
            
            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5 + Math.random() * 10;
                progressFill.style.width = `${Math.min(progress, 90)}%`;
                if (progress >= 90) clearInterval(progressInterval);
            }, 200);
            
            // Submit form
            const formData = new FormData(form);
            fetch(form.action, {
                method: form.method,
                body: formData
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.blob();
            })
            .then(blob => {
                // Complete progress
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressFill.style.background = 'var(--success)';
                buttonText.textContent = 'Terminé!';
                spinner.classList.add('hidden');
                
                // Trigger download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = form.id === 'creanceForm' ? 
                    `resultat_gestion_coupure_${new Date().toISOString().slice(0,10)}.xlsx` : 
                    'fichier_mise_a_jour.xlsx';
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                
                // Reset form
                setTimeout(() => {
                    form.reset();
                    progressFill.style.width = '0%';
                    progressFill.style.background = '';
                    buttonText.textContent = form.id === 'creanceForm' ? 'Traiter les fichiers' : 'Mettre à jour';
                    button.disabled = false;
                }, 2000);
            })
            .catch(error => {
                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressFill.style.background = 'var(--danger)';
                buttonText.textContent = 'Erreur';
                spinner.classList.add('hidden');
                
                // Show error
                error.json().then(err => {
                    statusMessage.textContent = err.error || 'Erreur lors du traitement';
                    statusMessage.classList.add('error-message');
                }).catch(() => {
                    statusMessage.textContent = 'Erreur lors du traitement';
                    statusMessage.classList.add('error-message');
                });
                
                // Reset button
                setTimeout(() => {
                    progressFill.style.width = '0%';
                    progressFill.style.background = '';
                    buttonText.textContent = form.id === 'creanceForm' ? 'Traiter les fichiers' : 'Mettre à jour';
                    button.disabled = false;
                }, 3000);
            });
        });
    });
});

    // Initialize file previews
    setupFilePreview('referenceFile', 'mise-a-jour-preview');
    setupFilePreview('creanceFile', 'gestion-coupure-preview');

    // File preview functionality
    function setupFilePreview(inputId, previewId) {
        const fileInput = document.getElementById(inputId);
        const previewDiv = document.getElementById(previewId);
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) {
                showPreviewPlaceholder(previewDiv);
                return;
            }
            
            showPreviewLoading(previewDiv);
            
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                previewExcelFile(file, previewDiv);
            } else if (file.name.endsWith('.csv')) {
                previewCSVFile(file, previewDiv);
            } else {
                showPreviewError(previewDiv, 'Format de fichier non supporté');
            }
        });
    }

    function previewExcelFile(file, previewDiv) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                if (workbook.SheetNames.length === 0) {
                    showPreviewError(previewDiv, 'Aucune feuille trouvée');
                    return;
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const html = XLSX.utils.sheet_to_html(firstSheet, {
                    editable: false,
                    header: '',
                    footer: ''
                });
                
                previewDiv.innerHTML = html;
                stylePreviewTable(previewDiv);
            } catch (error) {
                console.error('Excel preview error:', error);
                showPreviewError(previewDiv, 'Erreur de lecture du fichier Excel');
            }
        };
        reader.onerror = () => showPreviewError(previewDiv, 'Erreur de lecture du fichier');
        reader.readAsArrayBuffer(file);
    }

    function previewCSVFile(file, previewDiv) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                const lines = csvData.split('\n').filter(line => line.trim() !== '');
                
                if (lines.length === 0) {
                    showPreviewError(previewDiv, 'Fichier CSV vide');
                    return;
                }
                
                let tableHtml = '<table>';
                const headerCells = lines[0].split(',');
                
                // Add header row
                tableHtml += '<tr>';
                headerCells.forEach(cell => {
                    tableHtml += `<th>${cell.trim()}</th>`;
                });
                tableHtml += '</tr>';
                
                // Add data rows
                for (let i = 1; i < lines.length; i++) {
                    const cells = lines[i].split(',');
                    tableHtml += '<tr>';
                    cells.forEach(cell => {
                        tableHtml += `<td>${cell.trim()}</td>`;
                    });
                    tableHtml += '</tr>';
                }
                
                tableHtml += '</table>';
                previewDiv.innerHTML = tableHtml;
                stylePreviewTable(previewDiv);
            } catch (error) {
                console.error('CSV preview error:', error);
                showPreviewError(previewDiv, 'Erreur de lecture du fichier CSV');
            }
        };
        reader.onerror = () => showPreviewError(previewDiv, 'Erreur de lecture du fichier');
        reader.readAsText(file);
    }

    function showPreviewLoading(previewDiv) {
        previewDiv.innerHTML = `
            <div class="preview-loading">
                <div class="loading-spinner"></div>
                <p>Chargement de l'aperçu...</p>
            </div>
        `;
    }

    function showPreviewPlaceholder(previewDiv) {
        previewDiv.innerHTML = '<p class="preview-placeholder">Aucun fichier sélectionné</p>';
    }

    function showPreviewError(previewDiv, message) {
        previewDiv.innerHTML = `
            <div class="preview-error">
                <p>❌ ${message}</p>
            </div>
        `;
    }

    function stylePreviewTable(previewDiv) {
        const tables = previewDiv.getElementsByTagName('table');
        if (tables.length > 0) {
            const table = tables[0];
            table.classList.add('excel-preview-table');
        }
    }


// Add to your existing CSS:
/*
.preview-loading {
    text-align: center;
    padding: 2rem;
}

.loading-spinner {
    border: 3px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top-color: var(--primary);
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

.preview-error {
    color: var(--danger);
    text-align: center;
    padding: 2rem;
    font-weight: 500;
}
*/