// --- TYPES ---
export type KpiName = 'CSAT' | 'FCR' | 'Rechamada 24h' | 'Abs' | 'TMA' | string; // Allow string for new KPIs
export type KpiType = 'Porcentagem' | 'Número' | 'Tempo';

export interface KPI {
  name: KpiName;
  type: KpiType; 
  value: number;
}

export interface KpiDefinition {
    name: KpiName;
    type: KpiType;
    description: string;
    active: boolean;
    meta: {
        critical: number;
        regular: number;
        inverse: boolean;
    }
}

export interface Operator {
  id: number;
  name: string;
  email: string;
  teamId: number;
  teamName: string;
  supervisorId: number;
  supervisorName: string;
  coordinatorId: number;
  kpis: KPI[];
}

export interface Team {
    id: number;
    name: string;
    supervisorId: number;
    supervisorName: string;
    memberCount: number;
}

// Extended type for coordinator view with operators included
export interface ExtendedTeam extends Team {
    operators: Operator[];
}


export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Administrador' | 'Coordenador' | 'Supervisor';
  teamId?: number; // Only for supervisors
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface KpiHistoryData {
  labels: string[];
  datasets: {
    label: KpiName;
    data: number[];
    color: string;
    type: KpiType;
  }[];
}

// --- MOCK DATABASE (now mutable) ---
let users: User[] = [
  { id: 1, name: 'Admin', email: 'admin@example.com', role: 'Administrador' },
  { id: 2, name: 'Ana Coordenadora', email: 'ana.coordenador@example.com', role: 'Coordenador' },
  { id: 3, name: 'Waldir Supervisor', email: 'waldir.supervisor@example.com', role: 'Supervisor', teamId: 101 },
  { id: 4, name: 'Carlos Supervisor', email: 'carlos.supervisor@example.com', role: 'Supervisor', teamId: 102 },
  { id: 5, name: 'Waldir Admin Root', email: 'waldir@example.com', role: 'Administrador' },
];

let kpiDefinitions: KpiDefinition[] = [
    { name: 'CSAT', type: 'Porcentagem', description: 'Customer Satisfaction Score', active: true, meta: { critical: 85, regular: 95, inverse: false } },
    { name: 'FCR', type: 'Porcentagem', description: 'First Call Resolution', active: true, meta: { critical: 85, regular: 95, inverse: false } },
    { name: 'Rechamada 24h', type: 'Porcentagem', description: 'Chamadas retornadas em 24h', active: true, meta: { critical: 15, regular: 5, inverse: true } },
    { name: 'Abs', type: 'Porcentagem', description: 'Absenteísmo', active: false, meta: { critical: 5, regular: 2, inverse: true } },
    { name: 'TMA', type: 'Tempo', description: 'Tempo Médio de Atendimento (em segundos)', active: true, meta: { critical: 300, regular: 180, inverse: true } },
];

let operators: Operator[] = [
  // Equipe Waldir
  { id: 1001, name: 'João Silva', email: 'joao.s@example.com', teamId: 101, teamName: 'Equipe Waldir', supervisorId: 3, supervisorName: 'Waldir Supervisor', coordinatorId: 2, kpis: [
    { name: 'CSAT', type: 'Porcentagem', value: 98 }, { name: 'FCR', type: 'Porcentagem', value: 95 }, { name: 'Rechamada 24h', type: 'Porcentagem', value: 4 }, { name: 'Abs', type: 'Porcentagem', value: 1 }, { name: 'TMA', type: 'Tempo', value: 170 }
  ]},
  { id: 1002, name: 'Maria Oliveira', email: 'maria.o@example.com', teamId: 101, teamName: 'Equipe Waldir', supervisorId: 3, supervisorName: 'Waldir Supervisor', coordinatorId: 2, kpis: [
    { name: 'CSAT', type: 'Porcentagem', value: 84 }, { name: 'FCR', type: 'Porcentagem', value: 88 }, { name: 'Rechamada 24h', type: 'Porcentagem', value: 16 }, { name: 'Abs', type: 'Porcentagem', value: 5 }, { name: 'TMA', type: 'Tempo', value: 310 }
  ]},
  { id: 1003, name: 'Pedro Souza', email: 'pedro.s@example.com', teamId: 101, teamName: 'Equipe Waldir', supervisorId: 3, supervisorName: 'Waldir Supervisor', coordinatorId: 2, kpis: [
    { name: 'CSAT', type: 'Porcentagem', value: 91 }, { name: 'FCR', type: 'Porcentagem', value: 92 }, { name: 'Rechamada 24h', type: 'Porcentagem', value: 8 }, { name: 'Abs', type: 'Porcentagem', value: 2 }, { name: 'TMA', type: 'Tempo', value: 210 }
  ]},
  // Equipe Carlos
  { id: 1004, name: 'Beatriz Costa', email: 'beatriz.c@example.com', teamId: 102, teamName: 'Equipe Carlos', supervisorId: 4, supervisorName: 'Carlos Supervisor', coordinatorId: 2, kpis: [
    { name: 'CSAT', type: 'Porcentagem', value: 96 }, { name: 'FCR', type: 'Porcentagem', value: 97 }, { name: 'Rechamada 24h', type: 'Porcentagem', value: 3 }, { name: 'Abs', type: 'Porcentagem', value: 0 }, { name: 'TMA', type: 'Tempo', value: 160 }
  ]},
  { id: 1005, name: 'Lucas Martins', email: 'lucas.m@example.com', teamId: 102, teamName: 'Equipe Carlos', supervisorId: 4, supervisorName: 'Carlos Supervisor', coordinatorId: 2, kpis: [
    { name: 'CSAT', type: 'Porcentagem', value: 88 }, { name: 'FCR', type: 'Porcentagem', value: 90 }, { name: 'Rechamada 24h', type: 'Porcentagem', value: 12 }, { name: 'Abs', type: 'Porcentagem', value: 3 }, { name: 'TMA', type: 'Tempo', value: 250 }
  ]},
];


// --- API FUNCTIONS ---
export const getUser = (email: string, pass: string): User => {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Usuário não encontrado.');

  // Specific check for Admin Root
  if (user.email === 'waldir@example.com') {
    if (pass === 'Adm*2@2026') {
      return user;
    }
  } else { // Fallback for all other users
    if (pass === 'password123') {
      return user;
    }
  }

  throw new Error('Senha inválida.');
};

export const getTeamForSupervisor = (supervisorId: number): Operator[] => {
  return operators.filter(op => op.supervisorId === supervisorId);
};

export const getTeamForCoordinator = (coordinatorId: number): Operator[] => {
  // In our mock data, coordinatorId 2 can see everyone.
  if (coordinatorId === 2) return operators;
  return operators.filter(op => op.coordinatorId === coordinatorId);
};

export const getTeamsForCoordinator = (coordinatorId: number): ExtendedTeam[] => {
    const teamsMap = new Map<number, ExtendedTeam>();
    const coordinatorOperators = operators.filter(op => op.coordinatorId === coordinatorId);

    coordinatorOperators.forEach(op => {
        if (!teamsMap.has(op.teamId)) {
            teamsMap.set(op.teamId, {
                id: op.teamId,
                name: op.teamName,
                supervisorId: op.supervisorId,
                supervisorName: op.supervisorName,
                memberCount: 0,
                operators: []
            });
        }
        const team = teamsMap.get(op.teamId)!;
        team.memberCount++;
        team.operators.push(op);
    });
    return Array.from(teamsMap.values());
};


export const getAllOperators = (): Operator[] => {
    return JSON.parse(JSON.stringify(operators));
}

export const getOperatorsForExport = (): Operator[] => {
    return JSON.parse(JSON.stringify(operators));
}

// Admin functions
export const getAllKpis = (): KpiDefinition[] => JSON.parse(JSON.stringify(kpiDefinitions));
export const getAllUsers = (): User[] => JSON.parse(JSON.stringify(users));
export const getSupervisors = (): User[] => users.filter(u => u.role === 'Supervisor');

export const addKpi = (kpi: KpiDefinition) => {
    if (kpiDefinitions.some(k => k.name.toLowerCase() === kpi.name.toLowerCase())) {
        alert(`KPI "${kpi.name}" já existe.`);
        return;
    }
    kpiDefinitions.push(kpi);
}

export const updateKpi = (updatedKpi: KpiDefinition) => {
    const index = kpiDefinitions.findIndex(k => k.name === updatedKpi.name);
    if (index !== -1) {
        kpiDefinitions[index] = updatedKpi;
    } else {
        alert(`KPI "${updatedKpi.name}" não encontrado para atualização.`);
    }
}

export const addUser = (user: Omit<User, 'id'>) => {
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        alert(`Usuário com e-mail "${user.email}" já existe.`);
        return;
    }
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    // For invited users, we can assign a default teamId if they are a supervisor
    const teamId = user.role === 'Supervisor' ? 100 + newId : undefined;
    users.push({ id: newId, ...user, teamId });
    alert(`Convite enviado para ${user.email}. O novo usuário foi adicionado com uma senha padrão.`);
}

export const updateUser = (userToUpdate: User) => {
    const index = users.findIndex(u => u.id === userToUpdate.id);
    if (index !== -1) {
        users[index] = userToUpdate;
    } else {
        alert(`Usuário com ID "${userToUpdate.id}" não encontrado.`);
    }
}

export const deleteUser = (userId: number) => {
    users = users.filter(u => u.id !== userId);
}

export const updateOperatorsFromData = (newOperators: Operator[]) => {
    operators.length = 0; // Clear the array
    operators.push(...newOperators); // Add new data
    alert(`${newOperators.length} registros de operadores foram importados com sucesso!`);
}


export const getAllTeams = (): Team[] => {
    const teamsMap = new Map<number, Team>();
    operators.forEach(op => {
        if(!teamsMap.has(op.teamId)) {
            const supervisor = users.find(u => u.id === op.supervisorId);
            teamsMap.set(op.teamId, {
                id: op.teamId,
                name: op.teamName,
                supervisorId: op.supervisorId,
                supervisorName: supervisor?.name || 'Não definido',
                memberCount: 0
            });
        }
        const team = teamsMap.get(op.teamId);
        if(team) team.memberCount++;
    });
    return Array.from(teamsMap.values());
};


export const getNotificationsForUser = (user: User): Notification[] => {
    const notifications: Notification[] = [];
    let notifId = 1;
    const now = new Date();
    const allKpis = getAllKpis();

    const csatMeta = allKpis.find(k => k.name === 'CSAT')?.meta;

    if (user.role === 'Supervisor' && csatMeta) {
        const myTeam = getTeamForSupervisor(user.id);
        myTeam.forEach(op => {
            const csatKpi = op.kpis.find(k => k.name === 'CSAT');
            if(csatKpi && csatKpi.value < csatMeta.critical) {
                notifications.push({ id: notifId++, userId: user.id, title: 'Alerta de Performance', message: `O CSAT de ${op.name} está abaixo da meta crítica.`, read: false, timestamp: now.toISOString() });
            }
        });
    }

    if (user.role === 'Coordenador' && csatMeta) {
        const teams = getAllTeams().filter(t => operators.some(op => op.teamId === t.id && op.coordinatorId === user.id));
        
        teams.forEach(team => {
            const teamOps = operators.filter(op => op.teamId === team.id);
            const avgCsat = teamOps.reduce((acc, op) => acc + (op.kpis.find(k => k.name === 'CSAT')?.value || 0), 0) / teamOps.length;
            if (avgCsat < csatMeta.critical + 5) { // Um pouco acima da meta critica
                 notifications.push({ id: notifId++, userId: user.id, title: 'Alerta de Equipe', message: `O CSAT médio da ${team.name} está em ${avgCsat.toFixed(1)}%, abaixo do esperado.`, read: true, timestamp: new Date(now.getTime() - 3600000).toISOString() });
            }
        })
    }
    
    return notifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const scheduleFeedback = (operatorId: number, dateTime: string, notes: string): void => {
    const operator = operators.find(op => op.id === operatorId);
    if (!operator) {
        alert("Operador não encontrado.");
        return;
    }
    alert(`Feedback agendado para ${operator.name} em ${new Date(dateTime).toLocaleString()}.\nNotas: ${notes}`);
    // In a real app, this would save to a database.
};

export const getKpiHistory = (operators: Operator[], kpiDefinitions: KpiDefinition[]): KpiHistoryData => {
    const activeKpis = kpiDefinitions.filter(k => k.active);
    const labels = ['Sem. -4', 'Sem. -3', 'Sem. -2', 'Sem. -1', 'Atual'];
    
    const colors = ['#38bdf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

    const datasets = activeKpis.map((kpiDef, index) => {
        // Calculate current average for the group of operators
        const currentValues = operators
            .map(op => op.kpis.find(k => k.name === kpiDef.name)?.value)
            .filter(v => v !== undefined) as number[];
        
        const currentAvg = currentValues.length > 0 ? currentValues.reduce((a, b) => a + b, 0) / currentValues.length : (kpiDef.meta.regular + kpiDef.meta.critical) / 2;

        // Simulate past data with some randomness
        const data = labels.map((_, weekIndex) => {
            if (weekIndex === labels.length - 1) {
                return currentAvg; // Current week's data is the actual average
            }
            // For past weeks, create some variation
            const randomFactor = (Math.random() - 0.5) * 0.1; // +/- 5% variation
            let simulatedValue = currentAvg * (1 + randomFactor * (labels.length - 1 - weekIndex));

            // Clamp values to be realistic
            if (kpiDef.type === 'Porcentagem') {
                simulatedValue = Math.max(0, Math.min(100, simulatedValue));
            } else {
                 simulatedValue = Math.max(0, simulatedValue);
            }
            return simulatedValue;
        });

        return {
            label: kpiDef.name,
            data: data,
            color: colors[index % colors.length],
            type: kpiDef.type
        };
    });

    return { labels, datasets };
};

// --- DATA IMPORT/EXPORT FOR USERS ---

const getOperatorsForUser = (user: User): Operator[] => {
    switch (user.role) {
        case 'Administrador':
            return operators;
        case 'Coordenador':
            return getTeamForCoordinator(user.id);
        case 'Supervisor':
            return getTeamForSupervisor(user.id);
        default:
            return [];
    }
};

export const getTemplateForUser = (user: User): string => {
    const activeKpis = kpiDefinitions.filter(k => k.active).map(k => k.name);
    const headers = ['id', 'name', 'email', ...activeKpis].join(',');
    
    const operatorsToInclude = getOperatorsForUser(user);

    const csvContent = operatorsToInclude.map(op => {
        const operatorData = [op.id, op.name, op.email];
        const kpiValues = activeKpis.map(kpiName => {
            const kpi = op.kpis.find(k => k.name === kpiName);
            return kpi ? kpi.value : '';
        });
        return [...operatorData, ...kpiValues].join(',');
    }).join('\n');

    return `${headers}\n${csvContent}`;
};

export const updateDataForUser = (user: User, csvText: string): { updated: number, ignored: number, created: number } => {
    const manageableOperatorIds = new Set(getOperatorsForUser(user).map(op => op.id));
    
    let updated = 0;
    let ignored = 0;
    let created = 0;
    const lines = csvText.trim().split('\n');
    
    try {
        const headers = lines[0].trim().split(',').map(h => h.trim());
        const kpiHeaders = headers.slice(3); // id, name, email are first 3

        lines.slice(1).forEach(line => {
            if (!line.trim()) return;

            const values = line.trim().split(',');
            const operatorId = parseInt(values[0]);
            const operatorName = values[1];
            const operatorEmail = values[2];

            const kpisFromCsv: KPI[] = [];
            kpiHeaders.forEach((kpiName, index) => {
                const definition = kpiDefinitions.find(k => k.name === kpiName);
                const valueStr = values[index + 3];
                if (definition && valueStr && valueStr.trim() !== '') {
                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                        kpisFromCsv.push({ name: kpiName, type: definition.type, value });
                    }
                }
            });

            const operatorIndex = operators.findIndex(op => op.id === operatorId);

            // UPDATE existing operator
            if (operatorIndex !== -1) {
                if (!manageableOperatorIds.has(operatorId)) {
                    ignored++;
                    return;
                }

                const updatedKpis = [...operators[operatorIndex].kpis];
                kpisFromCsv.forEach(newKpi => {
                    const existingKpiIndex = updatedKpis.findIndex(k => k.name === newKpi.name);
                    if (existingKpiIndex !== -1) {
                        updatedKpis[existingKpiIndex].value = newKpi.value;
                    } else {
                        updatedKpis.push(newKpi);
                    }
                });
                operators[operatorIndex].kpis = updatedKpis;
                updated++;
            } 
            // INSERT new operator (only for Supervisors)
            else if (user.role === 'Supervisor' && operatorName && operatorEmail) {
                if (operators.some(op => op.email.toLowerCase() === operatorEmail.toLowerCase())) {
                    ignored++; return; // Prevent duplicates
                }

                const supervisor = users.find(u => u.id === user.id);
                if (!supervisor || !supervisor.teamId) {
                    ignored++; return; // Cannot determine team
                }
                
                const existingTeamOp = operators.find(op => op.teamId === supervisor.teamId);
                const coordinatorId = existingTeamOp ? existingTeamOp.coordinatorId : 2; // Default to coordinator 2 if team is new
                const teamName = existingTeamOp ? existingTeamOp.teamName : `Equipe ${supervisor.name}`;

                const newId = Math.max(...operators.map(o => o.id), 0) + 1;
                const newOperator: Operator = {
                    id: newId,
                    name: operatorName,
                    email: operatorEmail,
                    teamId: supervisor.teamId,
                    teamName: teamName,
                    supervisorId: supervisor.id,
                    supervisorName: supervisor.name,
                    coordinatorId: coordinatorId,
                    kpis: kpisFromCsv
                };

                operators.push(newOperator);
                created++;
            } else {
                ignored++; // Not updatable, and not insertable (e.g., coord trying to add user)
            }
        });

        alert(`${updated} registros atualizados, ${created} criados. ${ignored} registros ignorados (sem permissão, duplicados ou erro de formato).`);
        return { updated, ignored, created };

    } catch (error) {
        console.error("Erro ao importar CSV:", error);
        alert("Ocorreu um erro ao processar o arquivo. Verifique o formato e tente novamente.");
        return { updated: 0, created: 0, ignored: lines.length > 1 ? lines.length - 1 : 0 };
    }
};


// --- SETUP WIZARD FUNCTIONS ---

let setupComplete = false;

// Check if setup has been done. If more than 5 users (the initial defaults) exist, we assume it has.
// In a real app, this would be a database flag.
export const isSetupNeeded = (): boolean => {
    return !setupComplete && users.length <= 5; 
};

interface NewUser { name: string; email: string; }
interface NewSupervisor extends NewUser { coordinatorId: number; }

export const performInitialSetup = (
    {coordinators, supervisors}: {coordinators: NewUser[], supervisors: NewSupervisor[]}
) => {
    // 1. Get root admins
    const rootAdmins = users.filter(u => u.email === 'admin@example.com' || u.email === 'waldir@example.com');
    
    // 2. Clear existing mock data (except root admins)
    let newUsers: User[] = [...rootAdmins];
    let newId = Math.max(...rootAdmins.map(u => u.id), 0) + 1;

    // 3. Create new coordinators
    const createdCoordinators = coordinators.map(c => ({
        id: newId++,
        name: c.name,
        email: c.email,
        role: 'Coordenador' as const
    }));
    newUsers.push(...createdCoordinators);
    
    // 4. Create new supervisors and link them
    const createdSupervisors = supervisors.map(s => ({
        id: newId++,
        name: s.name,
        email: s.email,
        role: 'Supervisor' as const,
        teamId: 100 + newId // simple team ID generation
    }));
    newUsers.push(...createdSupervisors);
    
    // 5. Replace the old user list
    users = newUsers;
    
    // 6. Clear operators for this demo. In a real scenario, you'd associate them.
    while(operators.length > 0) operators.pop();
    
    // 7. Mark setup as complete
    setupComplete = true;
};