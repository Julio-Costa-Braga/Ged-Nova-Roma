        const DOCUMENT_CATEGORIES = [
            "RG - CPF - CERTIDÃƒO DE NASCIMENTO OU CASAMENTO",
            "PIS",
            "CTPS DIGITAL",
            "TITULO DE ELEITOR + COMPROVANTE DE ULTIMA VOTAÃ‡ÃƒO",
            "RESERVISTA",
            "DOCUMENTOS DOS DEPENDENTES (FILHOS)",
            "CPF DO CÃ”NJUGUE",
            "COMPROVANTE DE RESIDENCIA",
            "COMPROVANTE DE ESCOLARIDADE",
            "FOTO 3X4",
            "CARTÃƒO DE PASSAGEM (SE FOR OPTANTE)",
            "ASO (EXAME)",
            "CONTA BANCARIA (ITAU)",
            "CONTRATOS E REGISTROS"
        ];

        const RH_MOVIMENTACOES_CATEGORIES = [
            "Aviso de fÃ©rias",
            "Atestados medico",
            "OcorrÃªncias e desligamento"
        ];

        function buildEmptyDocumentFolders() {
            const folders = {};
            DOCUMENT_CATEGORIES.forEach(cat => { folders[cat] = { files: [] }; });
            return folders;
        }

        function buildEmptyRHFolders() {
            const folders = {};
            RH_MOVIMENTACOES_CATEGORIES.forEach(cat => { folders[cat] = { files: [] }; });
            return folders;
        }

        const EMPLOYEE_TABLE_COLUMNS = [
            "Matricula", "AdmissÃ£o", "DemissÃ£o", "FunÃ§Ã£o", "LocaÃ§Ã£o", "Unidade",
            "SituaÃ§Ã£o", "Data Nascimento", "Dia", "MÃªs AniversÃ¡rio", "Idade",
            "RemuneraÃ§Ã£o", "Telefone", "RG", "CPF", "PIS-PASEP",
            "Sexo", "Pai-MÃ£e", "TitulaÃ§Ã£o", "Curso", "Tempo ServiÃ§o",
            "E-mail Pessoal", "E-mail Corporativo"
        ];

        const hrCollaborators = [];


        let selectedHRCollaboratorId = null;
        let contractRecipientsTemp = [];
        let hrFilterStatus = 'todos';

        function populateContractRecipientOptions() {
            const select = document.getElementById('contractCollaborator');
            if (!select) return;
            select.innerHTML = '';
            hrCollaborators.forEach(collaborator => {
                const option = document.createElement('option');
                option.value = collaborator.id;
                option.text = collaborator.name;
                select.appendChild(option);
            });
        }

        function addContractEmailRecipient() {
            const input = document.getElementById('contractRecipientEmail');
            const email = input.value.trim();
            if (!email) {
                showToast('Eâ€‘mail obrigatÃ³rio', 'Digite um eâ€‘mail para adicionar Ã  fila.', 'bg-red-700');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Eâ€‘mail invÃ¡lido', 'Digite um endereÃ§o de eâ€‘mail vÃ¡lido.', 'bg-red-700');
                return;
            }
            if (contractRecipientsTemp.find(r => r.email === email)) {
                showToast('Eâ€‘mail duplicado', 'Este eâ€‘mail jÃ¡ estÃ¡ na fila.', 'bg-red-700');
                return;
            }
            contractRecipientsTemp.push({ email: email, status: 'Pendente' });
            input.value = '';
            renderContractRecipients();
        }

        function renderContractRecipients() {
            const container = document.getElementById('contractRecipientsList');
            container.innerHTML = '';
            contractRecipientsTemp.forEach((r, idx) => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between gap-3 bg-white p-2 rounded-lg border border-slate-200';
                div.innerHTML = `
                    <div class="text-sm"><strong>#${idx+1}</strong> ${r.email}</div>
                    <div class="flex gap-2"> 
                        <button class="text-xs px-3 py-1 bg-slate-100 rounded" onclick="moveContractRecipient(${idx}, -1)">â†‘</button>
                        <button class="text-xs px-3 py-1 bg-slate-100 rounded" onclick="moveContractRecipient(${idx}, 1)">â†“</button>
                        <button class="text-xs px-3 py-1 bg-red-100 text-red-700 rounded" onclick="removeContractRecipient(${idx})">Remover</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        function removeContractRecipient(index) {
            contractRecipientsTemp.splice(index, 1);
            renderContractRecipients();
        }

        function moveContractRecipient(index, delta) {
            const to = index + delta;
            if (to < 0 || to >= contractRecipientsTemp.length) return;
            const tmp = contractRecipientsTemp[to];
            contractRecipientsTemp[to] = contractRecipientsTemp[index];
            contractRecipientsTemp[index] = tmp;
            renderContractRecipients();
        }

        function loadStoredUsers() {
            const raw = localStorage.getItem('gedUsers');
            if (!raw) return [];
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }

        function toggleSidebarCategory(header) {
            const items = header.nextElementSibling;
            const chevron = header.querySelector('.icon-chevron');
            items.classList.toggle('open');
            chevron.classList.toggle('open');
        }

        function initSidebar() {
            const displayName = localStorage.getItem('gedUser') || localStorage.getItem('gedAuth') || 'Usuário';
            const access = localStorage.getItem('gedUserAccess') || '';
            const roleMap = { financeiro: 'Financeiro', rh: 'RH', ambos: 'Administrador', 'apenas-observador': 'Observador' };
            const role = roleMap[access] || 'Usuário';
            document.getElementById('sidebarUserName').textContent = displayName;
            document.getElementById('sidebarUserRole').textContent = role;
            document.getElementById('sidebarFooterName').textContent = displayName;
            document.getElementById('sidebarAvatarLetter').textContent = displayName.charAt(0).toUpperCase();
            if (typeof filterSidebarByModules === 'function') setTimeout(filterSidebarByModules, 50);
        }

        function checkPermission() {
            const activeUsername = localStorage.getItem('gedAuth');
            const modulesJson = localStorage.getItem('gedUserModules');

            if (!activeUsername) {
                allowPublicAccess('rh');
            }

            const users = loadStoredUsers();
            let sessionUser = users.find(u => u.username?.toLowerCase() === (activeUsername || '').toLowerCase());

            if (!sessionUser && activeUsername === 'guest') {
                // create a lightweight guest sessionUser
                sessionUser = { username: 'guest', name: 'Visitante', access: 'ambos', modules: JSON.parse(localStorage.getItem('gedUserModules') || JSON.stringify({ ged:true, rh:true, financeiro:true, gestao:true })), role: 'visitante' };
            }

            if (!sessionUser) {
                // no matching user — purge session and allow guest fallback
                localStorage.removeItem('gedAuth');
                localStorage.removeItem('gedUser');
                localStorage.removeItem('gedUserRole');
                localStorage.removeItem('gedUserAccess');
                localStorage.removeItem('gedUserModules');
                localStorage.removeItem('gedUserReadOnly');
                allowPublicAccess('rh');
                sessionUser = { username: 'guest', name: 'Visitante', access: 'ambos', modules: JSON.parse(localStorage.getItem('gedUserModules') || '{}'), role: 'visitante' };
            }

            normalizeUserModules(sessionUser);

            if (sessionUser.modules.rh) {
                initSidebar();
                if (isSessionReadOnly()) {
                    const el = document.getElementById('sidebarUserRole'); if (el) el.textContent = 'Observador';
                    setTimeout(applyObserverMode, 100);
                }
                return true;
            }

            if (sessionUser.modules.gestao) { window.location.href = 'gestao.html'; return false; }
            if (sessionUser.modules.financeiro || sessionUser.modules.ged) { window.location.href = 'ged.html'; return false; }
            window.location.href = 'observador.html';
            return false;
        }

        function logout() {
            localStorage.removeItem('gedAuth');
            localStorage.removeItem('gedUser');
            localStorage.removeItem('gedUserRole');
            localStorage.removeItem('gedUserAccess');
            localStorage.removeItem('gedUserModules');
            localStorage.removeItem('gedUserReadOnly');
            window.location.href = 'index.html';
        }

        function highlightActiveTab() {
            const currentPage = window.location.pathname.split('/').pop() || 'rh.html';
            const navTabs = document.querySelectorAll('.nav-tab');
            
            navTabs.forEach(tab => {
                if (tab.getAttribute('data-page') === currentPage.replace('.html', '')) {
                    tab.classList.remove('bg-slate-100', 'text-slate-900', 'hover:bg-slate-200');
                    tab.classList.add('bg-yellow-400', 'text-slate-900', 'font-bold');
                } else {
                    tab.classList.remove('bg-yellow-400', 'font-bold');
                    tab.classList.add('bg-slate-100', 'text-slate-900');
                }
            });
        }

        function setActiveHRTab(tab) {
            const docsTab = document.getElementById('tabRHDocs');
            const contractsTab = document.getElementById('tabRHContracts');
            const employeesTab = document.getElementById('tabRHEmployees');
            const docsButton = document.getElementById('tabRHDocsButton');
            const contractsButton = document.getElementById('tabRHContractsButton');
            const employeesButton = document.getElementById('tabRHEmployeeButton');

            [docsTab, contractsTab, employeesTab].forEach(el => { if (el) el.classList.add('hidden'); });

            function activate(btn) {
                [docsButton, contractsButton, employeesButton].forEach(b => {
                    if (b) { b.classList.remove('bg-blue-900','text-white'); b.classList.add('bg-slate-100','text-slate-700'); }
                });
                if (btn) { btn.classList.add('bg-blue-900','text-white'); btn.classList.remove('bg-slate-100','text-slate-700'); }
            }

            if (tab === 'employees' && employeesTab) {
                employeesTab.classList.remove('hidden');
                activate(employeesButton);
                renderEmployeeTable();
            } else if (tab === 'contracts' && contractsTab) {
                contractsTab.classList.remove('hidden');
                activate(contractsButton);
            } else {
                if (docsTab) docsTab.classList.remove('hidden');
                activate(docsButton);
            }
        }

        function renderEmployeeTable() {
            const tbody = document.getElementById('hrEmployeeTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            hrCollaborators.forEach(c => {
                const d = c.employeeData || {};
                tbody.innerHTML += `
                    <tr class="border-b border-slate-200 hover:bg-slate-50 transition text-xs">
                        <td class="p-3 font-medium">${escapeHTML(c.name)}</td>
                        <td class="p-3">${escapeHTML(d['Matricula'] || d.matricula || '-')}</td>
                        <td class="p-3">${escapeHTML(c.role || d['Função'] || d.funcao || '-')}</td>
                        <td class="p-3">${escapeHTML(d['Unidade'] || d.unidade || '-')}</td>
                        <td class="p-3">${escapeHTML(d['Situação'] || d.situacao || (c.active ? 'Ativo' : 'Inativo'))}</td>
                        <td class="p-3">${escapeHTML(c.admissionDate || d['Admissão'] || d.admissao || '-')}</td>
                        <td class="p-3">${escapeHTML(d['Remuneração'] || d.remuneracao || '-')}</td>
                        <td class="p-3 text-center">
                            <button onclick="openAddCollaboratorModal(${c.id})" class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition"><i data-lucide="edit-3" class="w-3 h-3 inline"></i></button>
                        </td>
                    </tr>
                `;});}