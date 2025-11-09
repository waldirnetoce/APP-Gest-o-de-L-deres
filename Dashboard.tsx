import React, { useState, useMemo, useRef, Fragment, useEffect } from 'react';
// Fix: Imported KpiName and KpiType to resolve type errors.
import { User, Operator, getTeamForSupervisor, getTeamForCoordinator, KPI, getAllKpis, KpiDefinition, KpiName, KpiType, Team, getAllUsers, addKpi, addUser, getOperatorsForExport, scheduleFeedback, updateUser, deleteUser, updateOperatorsFromData, getAllOperators, getAllTeams, getTemplateForUser, updateDataForUser, getSupervisors, updateKpi, ExtendedTeam, getTeamsForCoordinator, getKpiHistory, KpiHistoryData } from './api';
import FeedbackModal from './FeedbackModal';
import NotificationBell from './NotificationBell';
import { LogoutIcon, UserGroupIcon, ChartBarIcon, SettingsIcon, EditIcon, TrashIcon, AddIcon, UserCircleIcon, UploadIcon, CalendarIcon, ChevronLeftIcon, DownloadIcon, TrendingUpIcon, TrendingDownIcon, SunIcon, MoonIcon, MailIcon } from './components/icons';
import { useTheme } from './ThemeContext';

// --- Helper Components from other files ---

const ProfilePicture: React.FC<{ pic: string | null; onImageUpload: (file: File) => void; }> = ({ pic, onImageUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };
    return (
        <div className="relative">
            <button onClick={handleClick} className="rounded-full h-10 w-10 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-sky-500">
                {pic ? (
                    <img src={pic} alt="User" className="rounded-full h-10 w-10 object-cover" />
                ) : (
                    <UserCircleIcon className="h-8 w-8" />
                )}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
        </div>
    );
};

// --- Common Components ---
const getKpiColor = (value: number, kpiDef: KpiDefinition): string => {
  if (!kpiDef) return 'text-gray-600 dark:text-gray-300';

  const { meta, active } = kpiDef;
  if (!active) return 'text-gray-400 dark:text-gray-500';

  if (meta.inverse) {
    if (value <= meta.regular) return 'text-green-600 dark:text-green-400';
    if (value <= meta.critical) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  } else {
    if (value >= meta.regular) return 'text-green-600 dark:text-green-400';
    if (value >= meta.critical) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
};


const getKpiBgColor = (value: number, kpiDef: KpiDefinition): string => {
    if (!kpiDef || !kpiDef.active) return 'bg-gray-400 dark:bg-gray-500';

    if (kpiDef.meta.inverse) {
        if (value <= kpiDef.meta.regular) return 'bg-green-500';
        if (value <= kpiDef.meta.critical) return 'bg-yellow-500';
        return 'bg-red-500';
    } else {
        if (value >= kpiDef.meta.regular) return 'bg-green-500';
        if (value >= kpiDef.meta.critical) return 'bg-yellow-500';
        return 'bg-red-500';
    }
};


const formatKpiValue = (value: number, type: KpiType): string => {
    switch(type) {
        case 'Porcentagem': return `${value.toFixed(1)}%`;
        case 'Tempo': return `${Math.floor(value / 60)}:${(value % 60).toFixed(0).padStart(2, '0')}`;
        case 'Número': return value.toFixed(1);
        default: return value.toString();
    }
};

const OperatorTable: React.FC<{
    operators: Operator[];
    kpiDefinitions: KpiDefinition[];
    onRowClick: (op: Operator) => void;
    onFeedbackClick: (op: Operator) => void;
}> = ({ operators, kpiDefinitions, onRowClick, onFeedbackClick }) => (
     <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left">
            <thead className="bg-gray-100 dark:bg-gray-900/70">
            <tr>
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Operador</th>
                {kpiDefinitions.filter(k => k.active).map(kpiDef => (
                    <th key={kpiDef.name} className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{kpiDef.name}</th>
                ))}
                <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Ações</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {operators.map((operator) => (
                <tr key={operator.id} onClick={() => onRowClick(operator)} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <td className="p-4 font-medium">{operator.name}</td>
                {kpiDefinitions.filter(k => k.active).map(kpiDef => {
                    const kpi = operator.kpis.find(k => k.name === kpiDef.name);
                    return (
                        <td key={kpiDef.name} className={`p-4 font-mono font-semibold ${kpi ? getKpiColor(kpi.value, kpiDef) : 'text-gray-400 dark:text-gray-500'}`}>
                            {kpi ? formatKpiValue(kpi.value, kpi.type) : '-'}
                        </td>
                    );
                })}
                <td className="p-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onFeedbackClick(operator)} className="px-3 py-1 text-sm font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 rounded-md hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors">
                    Feedback
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    </div>
);


// --- Admin Dashboard Components ---
const AdminDashboard: React.FC<{user: User, kpiDefinitions: KpiDefinition[], onKpisChange: () => void, onDataUpdate: () => void}> = ({ user, kpiDefinitions: initialKpis, onKpisChange, onDataUpdate}) => {
    const [kpis, setKpis] = useState<KpiDefinition[]>(initialKpis);
    const [users, setUsers] = useState<User[]>(() => getAllUsers());
    const [allOperators, setAllOperators] = useState<Operator[]>(() => getAllOperators());
    const [adminTab, setAdminTab] = useState<'panel' | 'coordinator' | 'supervisor'>('panel');
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | null>(null);

    const [isKpiModalOpen, setKpiModalOpen] = useState(false);
    const [editingKpi, setEditingKpi] = useState<KpiDefinition | null>(null);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isMessageModalOpen, setMessageModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [messagingUser, setMessagingUser] = useState<User | null>(null);

    const supervisors = useMemo(() => getSupervisors(), [users]);

    useEffect(() => {
        setAllOperators(getAllOperators());
    }, [kpis, user, onDataUpdate]);

    const handleKpiToggle = (kpiName: string) => {
        const updatedKpis = kpis.map(kpi => 
            kpi.name === kpiName ? { ...kpi, active: !kpi.active } : kpi
        );
        setKpis(updatedKpis);
    };

    const handleSaveKpi = (kpiData: KpiDefinition) => {
        if (editingKpi) {
            updateKpi(kpiData);
        } else {
            addKpi(kpiData);
        }
        setKpis(getAllKpis());
        onKpisChange();
        setKpiModalOpen(false);
        setEditingKpi(null);
    };
    
    const handleSendInvite = (newUser: Omit<User, 'id'>) => {
        addUser(newUser);
        setUsers(getAllUsers()); // Refresh user list
        
        const subject = "Você foi convidado para o KPI Manager";
        const body = `Olá ${newUser.name},\n\nVocê foi convidado para se juntar à plataforma KPI Manager como ${newUser.role}.\n\nSeu login é seu e-mail (${newUser.email}) e sua senha inicial é "password123". Recomendamos que você a altere após o primeiro acesso.\n\nAtenciosamente,\nA Administração`;
        window.location.href = `mailto:${newUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setInviteModalOpen(false);
        setEditingUser(null);
    };
    
    const handleSendMessage = (recipient: User, message: string) => {
        alert(`Mensagem para ${recipient.name}:\n\n"${message}"\n\n(Simulação de envio)`);
        setMessageModalOpen(false);
        setMessagingUser(null);
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setInviteModalOpen(true);
    }
    
    const handleDeleteUser = (userId: number) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            deleteUser(userId);
            setUsers(getAllUsers());
        }
    }
    
    const renderAdminContent = () => {
        switch (adminTab) {
            case 'coordinator':
                return <TeamPerformanceView user={user} teamData={getAllOperators()} kpiDefinitions={kpis} onOperatorClick={()=>{}} onFeedbackClick={()=>{}} onNewFeedbackClick={()=>{}} />;
            case 'supervisor':
                const selectedTeam = selectedSupervisorId ? getTeamForSupervisor(selectedSupervisorId) : [];
                return (
                    <div>
                        <select onChange={(e) => setSelectedSupervisorId(Number(e.target.value))} defaultValue="" className="mb-4 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            <option value="" disabled>Selecione um supervisor...</option>
                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {selectedSupervisorId && <TeamPerformanceView user={user} teamData={selectedTeam} kpiDefinitions={kpis} onOperatorClick={()=>{}} onFeedbackClick={()=>{}} onNewFeedbackClick={()=>{}} />}
                    </div>
                );
            case 'panel':
            default:
                return (
                    <div className="space-y-8">
                         <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><ChartBarIcon /> Visão Geral da Operação</h3>
                            <OperatorTable operators={allOperators} kpiDefinitions={kpis} onRowClick={() => {}} onFeedbackClick={() => {}}/>
                         </div>
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><SettingsIcon /> Gerenciar KPIs</h3>
                                    <button onClick={() => { setEditingKpi(null); setKpiModalOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">
                                        <AddIcon /> Novo KPI
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {kpis.map(kpi => (
                                        <div key={kpi.name} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{kpi.name} <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{kpi.type}</span></p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Metas: Regular &gt;= {kpi.meta.regular}, Crítico &lt;= {kpi.meta.critical} {kpi.meta.inverse ? '(Inverso)' : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setEditingKpi(kpi); setKpiModalOpen(true); }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"><EditIcon className="h-5 w-5"/></button>
                                                <ToggleSwitch enabled={kpi.active} onChange={() => handleKpiToggle(kpi.name)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserGroupIcon /> Gerenciar Usuários</h3>
                                    <button onClick={() => { setEditingUser(null); setInviteModalOpen(true);}} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">
                                        <AddIcon /> Convidar Usuário
                                    </button>
                                </div>
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map(u => (
                                        <li key={u.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-gray-200">{u.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                    u.role === 'Administrador' ? 'bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300' :
                                                    u.role === 'Coordenador' ? 'bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300' :
                                                    'bg-sky-500/20 dark:bg-sky-500/30 text-sky-700 dark:text-sky-300'
                                                }`}>{u.role}</span>
                                                <button onClick={() => { setMessagingUser(u); setMessageModalOpen(true); }} className="p-2 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"><MailIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleEditUser(u)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"><EditIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"><TrashIcon className="h-5 w-5"/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-gray-300 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setAdminTab('panel')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${adminTab === 'panel' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-500'}`}>Painel Admin</button>
                    <button onClick={() => setAdminTab('coordinator')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${adminTab === 'coordinator' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-500'}`}>Visão Coordenador</button>
                    <button onClick={() => setAdminTab('supervisor')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${adminTab === 'supervisor' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-500'}`}>Visão Supervisor</button>
                </nav>
            </div>
            <div className="mt-6">
              {renderAdminContent()}
            </div>
            
            {isKpiModalOpen && <KpiModal kpiToEdit={editingKpi} onClose={() => { setKpiModalOpen(false); setEditingKpi(null); }} onSave={handleSaveKpi} />}
            {isInviteModalOpen && <InviteModal userToEdit={editingUser} onClose={() => { setInviteModalOpen(false); setEditingUser(null);}} onSave={handleSendInvite} />}
            {isMessageModalOpen && messagingUser && <MessageModal recipient={messagingUser} onClose={() => {setMessageModalOpen(false); setMessagingUser(null);}} onSend={handleSendMessage} />}
        </div>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-sky-500 ${
      enabled ? 'bg-sky-600' : 'bg-gray-400 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);


const OperatorDetailView: React.FC<{ operator: Operator; kpiDefinitions: KpiDefinition[]; onBack: () => void; onFeedback: (op: Operator) => void;}> = ({ operator, kpiDefinitions, onBack, onFeedback }) => {
    
    const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const date = formData.get('feedback-date') as string;
        const time = formData.get('feedback-time') as string;
        const notes = formData.get('feedback-notes') as string;
        if (date && time) {
            scheduleFeedback(operator.id, `${date}T${time}`, notes);
            e.currentTarget.reset();
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 mb-6 font-semibold">
                <ChevronLeftIcon /> Voltar para a equipe
            </button>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left side - KPIs */}
                <div className="flex-grow bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Painel de {operator.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{operator.email}</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {operator.kpis.map(kpi => {
                            const kpiDef = kpiDefinitions.find(d => d.name === kpi.name);
                            if (!kpiDef) return null;
                            return (
                                <div key={kpi.name} className="bg-gray-100 dark:bg-gray-900/70 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{kpi.name}</p>
                                    <p className={`text-3xl font-bold font-mono ${getKpiColor(kpi.value, kpiDef)}`}>
                                        {formatKpiValue(kpi.value, kpi.type)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ações</h3>
                         <button onClick={() => onFeedback(operator)} className="w-full px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">
                            Dar Feedback
                          </button>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Agendar Próximo Feedback</h3>
                         <form className="space-y-4" onSubmit={handleScheduleSubmit}>
                             <div>
                                <label htmlFor="feedback-date" className="text-sm text-gray-600 dark:text-gray-400">Data</label>
                                <input type="date" name="feedback-date" id="feedback-date" required className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                             </div>
                             <div>
                                <label htmlFor="feedback-time" className="text-sm text-gray-600 dark:text-gray-400">Hora</label>
                                <input type="time" name="feedback-time" id="feedback-time" required className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                             </div>
                              <div>
                                <label htmlFor="feedback-notes" className="text-sm text-gray-600 dark:text-gray-400">Notas</label>
                                <textarea name="feedback-notes" id="feedback-notes" rows={2} placeholder="Tópicos a abordar..." className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" />
                             </div>
                             <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 rounded-md hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors">
                                <CalendarIcon /> Agendar
                            </button>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- NEW ELEGANT DASHBOARD COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean; }> = ({ title, value, trend, isPositive }) => (
    <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`flex items-center text-sm mt-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? <TrendingUpIcon className="h-4 w-4 mr-1" /> : <TrendingDownIcon className="h-4 w-4 mr-1" />}
            <span>{trend}</span>
        </div>
    </div>
);

const PerformanceChart: React.FC<{ teamData: Operator[], kpiDefinitions: KpiDefinition[], kpiName: KpiName, onOperatorClick: (op: Operator) => void; }> = ({ teamData, kpiDefinitions, kpiName, onOperatorClick }) => {
    const kpiDef = kpiDefinitions.find(k => k.name === kpiName);
    
    if (!kpiDef) return (
        <div className="h-80 w-full flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">Selecione um KPI para visualizar o gráfico.</p>
        </div>
    );

    const values = teamData.map(op => op.kpis.find(k => k.name === kpiName)?.value ?? 0);
    const maxValue = Math.max(...values, kpiDef.meta.regular, kpiDef.meta.critical) * 1.1;

    return (
        <div className="h-80 w-full p-4 flex items-end justify-around gap-2 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 relative">
            {/* Y-axis lines */}
             {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute left-4 right-4 border-t border-dashed border-gray-300 dark:border-gray-700/50" style={{ bottom: `${(i + 1) * 20}%` }}>
                     <span className="text-xs text-gray-400 dark:text-gray-500 absolute -left-4 -translate-y-1/2 bg-gray-100/50 dark:bg-gray-900/50 px-1">{((maxValue / 5) * (i + 1)).toFixed(0)}</span>
                </div>
            ))}
            
            {/* Bars */}
            {teamData.map(operator => {
                const kpi = operator.kpis.find(k => k.name === kpiName);
                const value = kpi?.value ?? 0;
                const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                const bgColor = kpi ? getKpiBgColor(kpi.value, kpiDef) : 'bg-gray-400';

                return (
                    <button key={operator.id} onClick={() => onOperatorClick(operator)} className="flex-1 flex flex-col items-center justify-end h-full group focus:outline-none" title={`${operator.name}: ${kpi ? formatKpiValue(value, kpiDef.type) : 'N/A'}`}>
                        <div className="text-xs font-bold mb-1 text-gray-800 dark:text-gray-200 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                            {kpi ? formatKpiValue(value, kpiDef.type) : '-'}
                        </div>
                        <div
                            className={`w-3/4 max-w-[50px] rounded-t-md transition-all duration-300 ease-out group-hover:opacity-100 opacity-80 group-focus:ring-2 group-focus:ring-sky-500 ${bgColor}`}
                            style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs mt-2 text-center truncate w-full text-gray-600 dark:text-gray-400 font-medium">{operator.name}</div>
                    </button>
                );
            })}
        </div>
    );
};

const KpiEvolutionChart: React.FC<{ data: KpiHistoryData }> = ({ data }) => {
    const [visibleKpis, setVisibleKpis] = useState<KpiName[]>(() => data.datasets.map(d => d.label));
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    const toggleKpiVisibility = (kpiName: KpiName) => {
        setVisibleKpis(prev =>
            prev.includes(kpiName)
                ? prev.filter(k => k !== kpiName)
                : [...prev, kpiName]
        );
    };

    const filteredDatasets = data.datasets.filter(d => visibleKpis.includes(d.label));

    // Chart dimensions and padding
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate scales
    const allValues = filteredDatasets.flatMap(d => d.data);
    const yMax = allValues.length > 0 ? Math.max(...allValues) * 1.1 : 100;
    const yMin = 0;

    const xScale = (index: number) => padding.left + (index / (data.labels.length - 1)) * chartWidth;
    const yScale = (value: number) => height - padding.bottom - ((value - yMin) / (yMax - yMin)) * chartHeight;

    const linePaths = filteredDatasets.map(dataset => {
        const path = dataset.data
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(point)}`)
            .join(' ');
        return { ...dataset, path };
    });
    
    return (
        <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Evolução dos Indicadores</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                {data.datasets.map(dataset => (
                    <button key={dataset.label} onClick={() => toggleKpiVisibility(dataset.label)} className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: visibleKpis.includes(dataset.label) ? dataset.color : '#9ca3af' }}></span>
                        <span className={visibleKpis.includes(dataset.label) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 line-through'}>{dataset.label}</span>
                    </button>
                ))}
            </div>
            
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                     {[...Array(5)].map((_, i) => {
                        const y = padding.top + (i / 4) * chartHeight;
                        const value = yMax - (i / 4) * (yMax - yMin);
                        return (
                            <g key={i}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeDasharray="2,2" />
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-xs fill-current text-gray-500 dark:text-gray-400">{value.toFixed(0)}</text>
                            </g>
                        );
                    })}
                    {data.labels.map((label, i) => (
                        <text key={label} x={xScale(i)} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-current text-gray-500 dark:text-gray-400">{label}</text>
                    ))}
                    {linePaths.map(line => (
                        <path key={line.label} d={line.path} fill="none" stroke={line.color} strokeWidth="2.5" className="transition-opacity" />
                    ))}
                    {linePaths.map(line => (
                        <g key={`points-${line.label}`}>
                            {line.data.map((point, i) => (
                                <circle
                                    key={`${line.label}-${i}`}
                                    cx={xScale(i)}
                                    cy={yScale(point)}
                                    r="8"
                                    fill="transparent"
                                    onMouseOver={() => setTooltip({ x: xScale(i) / width * 100, y: yScale(point), content: `${line.label}: ${formatKpiValue(point, line.type)}` })}
                                    onMouseOut={() => setTooltip(null)}
                                />
                            ))}
                             {line.data.map((point, i) => (
                                <circle
                                    key={`dot-${line.label}-${i}`}
                                    cx={xScale(i)}
                                    cy={yScale(point)}
                                    r="4"
                                    fill={line.color}
                                    className="pointer-events-none"
                                />
                            ))}
                        </g>
                    ))}
                </svg>
                {tooltip && (
                    <div
                        className="absolute p-2 text-xs text-white bg-gray-800 dark:bg-gray-900 rounded-md shadow-lg pointer-events-none transition-transform"
                        style={{
                            left: `${tooltip.x}%`,
                            top: tooltip.y,
                            transform: `translate(-50%, -120%)`,
                        }}
                    >
                        {tooltip.content}
                    </div>
                )}
            </div>
        </div>
    );
};


const TeamPerformanceView: React.FC<{
    user: User;
    teamData: Operator[];
    kpiDefinitions: KpiDefinition[];
    onOperatorClick: (op: Operator) => void;
    onFeedbackClick: (op: Operator) => void;
    onNewFeedbackClick: () => void;
    onBack?: () => void;
}> = ({ user, teamData, kpiDefinitions, onOperatorClick, onFeedbackClick, onNewFeedbackClick, onBack }) => {
    
    const activeKpis = useMemo(() => kpiDefinitions.filter(k => k.active), [kpiDefinitions]);
    const [chartKpi, setChartKpi] = useState<KpiName | null>(activeKpis.length > 0 ? activeKpis[0].name : null);
    const historyData = useMemo(() => getKpiHistory(teamData, kpiDefinitions), [teamData, kpiDefinitions]);

    const teamAverages = useMemo(() => {
        if (teamData.length === 0) return [];
        return activeKpis.map(kpiDef => {
            const values = teamData
                .map(op => op.kpis.find(k => k.name === kpiDef.name)?.value)
                .filter(v => v !== undefined) as number[];
            
            if (values.length === 0) return { name: kpiDef.name, type: kpiDef.type, avg: 0, meta: kpiDef.meta };
            
            const sum = values.reduce((acc, v) => acc + v, 0);
            return { name: kpiDef.name, type: kpiDef.type, avg: sum / values.length, meta: kpiDef.meta };
        });
    }, [teamData, activeKpis]);

    return (
        <div className="space-y-8">
             {onBack && (
                <button onClick={onBack} className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold">
                    <ChevronLeftIcon /> Voltar para visão geral
                </button>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {teamAverages.map(kpiAvg => {
                    const kpiDef = activeKpis.find(k => k.name === kpiAvg.name);
                    const isPositive = kpiDef ? kpiAvg.meta.inverse 
                        ? kpiAvg.avg <= kpiAvg.meta.regular 
                        : kpiAvg.avg >= kpiAvg.meta.regular
                        : false;

                    return (
                        <StatCard 
                            key={kpiAvg.name}
                            title={`${kpiAvg.name} (Média)`}
                            value={formatKpiValue(kpiAvg.avg, kpiAvg.type)}
                            trend="+2.5% sem."
                            isPositive={isPositive}
                        />
                    );
                })}
            </div>

            <KpiEvolutionChart data={historyData} />
            
            <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparativo de Performance Individual</h3>
                     <div className="flex items-center gap-4">
                        <select
                            value={chartKpi ?? ''}
                            onChange={(e) => setChartKpi(e.target.value as KpiName)}
                            className="p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                            {activeKpis.map(kpi => <option key={kpi.name} value={kpi.name}>{kpi.name}</option>)}
                        </select>
                        {user.role !== 'Administrador' &&
                            <button onClick={onNewFeedbackClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors">
                                <AddIcon /> <span className="hidden sm:inline">Novo Feedback</span>
                            </button>
                        }
                    </div>
                </div>
                {chartKpi && <PerformanceChart teamData={teamData} kpiDefinitions={kpiDefinitions} kpiName={chartKpi} onOperatorClick={onOperatorClick} />}
            </div>

            <OperatorTable 
                operators={teamData}
                kpiDefinitions={kpiDefinitions}
                onRowClick={onOperatorClick}
                onFeedbackClick={onFeedbackClick}
            />
        </div>
    );
};

const CoordinatorView: React.FC<{
    user: User;
    teams: ExtendedTeam[];
    kpiDefinitions: KpiDefinition[];
    onTeamClick: (team: ExtendedTeam) => void;
    onNewFeedbackClick: () => void;
}> = ({ user, teams, kpiDefinitions, onTeamClick, onNewFeedbackClick }) => {
    const activeKpis = useMemo(() => kpiDefinitions.filter(k => k.active), [kpiDefinitions]);
    const [chartKpi, setChartKpi] = useState<KpiName | null>(activeKpis.length > 0 ? activeKpis[0].name : null);

    const allOperators = useMemo(() => teams.flatMap(t => t.operators), [teams]);
    const historyData = useMemo(() => getKpiHistory(allOperators, kpiDefinitions), [allOperators, kpiDefinitions]);

    const overallAverages = useMemo(() => {
        if (allOperators.length === 0) return [];
        return activeKpis.map(kpiDef => {
            const values = allOperators
                .map(op => op.kpis.find(k => k.name === kpiDef.name)?.value)
                .filter(v => v !== undefined) as number[];
            
            const sum = values.reduce((acc, v) => acc + v, 0);
            return { name: kpiDef.name, type: kpiDef.type, avg: sum / values.length, meta: kpiDef.meta };
        });
    }, [allOperators, activeKpis]);
    
    return (
         <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {overallAverages.map(kpiAvg => {
                    const isPositive = kpiAvg.meta.inverse 
                        ? kpiAvg.avg <= kpiAvg.meta.regular 
                        : kpiAvg.avg >= kpiAvg.meta.regular;
                    return (
                        <StatCard 
                            key={kpiAvg.name}
                            title={`${kpiAvg.name} (Geral)`}
                            value={formatKpiValue(kpiAvg.avg, kpiAvg.type)}
                            trend="+1.8% sem."
                            isPositive={isPositive}
                        />
                    );
                })}
            </div>

            <KpiEvolutionChart data={historyData} />

            <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Comparativo de Performance por Equipe</h3>
                     <div className="flex items-center gap-4">
                        <select
                            value={chartKpi ?? ''}
                            onChange={(e) => setChartKpi(e.target.value as KpiName)}
                            className="p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                            {activeKpis.map(kpi => <option key={kpi.name} value={kpi.name}>{kpi.name}</option>)}
                        </select>
                         <button onClick={onNewFeedbackClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors">
                            <AddIcon /> <span className="hidden sm:inline">Novo Feedback</span>
                        </button>
                    </div>
                </div>
                {chartKpi && <TeamComparisonChart teams={teams} kpiDefinitions={kpiDefinitions} kpiName={chartKpi} onTeamClick={onTeamClick} />}
            </div>
            
            <TeamTable teams={teams} kpiDefinitions={kpiDefinitions} onTeamClick={onTeamClick} />
        </div>
    );
}

const TeamComparisonChart: React.FC<{ teams: ExtendedTeam[], kpiDefinitions: KpiDefinition[], kpiName: KpiName, onTeamClick: (team: ExtendedTeam) => void; }> = ({ teams, kpiDefinitions, kpiName, onTeamClick }) => {
    const kpiDef = kpiDefinitions.find(k => k.name === kpiName);
    if (!kpiDef) return null;
    
    const teamAverages = teams.map(team => {
        const values = team.operators.map(op => op.kpis.find(k => k.name === kpiName)?.value).filter(v => v !== undefined) as number[];
        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        return { ...team, avg };
    });

    const maxValue = Math.max(...teamAverages.map(t => t.avg), kpiDef.meta.regular, kpiDef.meta.critical) * 1.1;

    return (
        <div className="h-80 w-full p-4 flex items-end justify-around gap-2 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 relative">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute left-4 right-4 border-t border-dashed border-gray-300 dark:border-gray-700/50" style={{ bottom: `${(i + 1) * 20}%` }}>
                     <span className="text-xs text-gray-400 dark:text-gray-500 absolute -left-4 -translate-y-1/2 bg-gray-100/50 dark:bg-gray-900/50 px-1">{((maxValue / 5) * (i + 1)).toFixed(0)}</span>
                </div>
            ))}
            {teamAverages.map(team => {
                const height = maxValue > 0 ? (team.avg / maxValue) * 100 : 0;
                const bgColor = getKpiBgColor(team.avg, kpiDef);
                return (
                    <button key={team.id} onClick={() => onTeamClick(team)} className="flex-1 flex flex-col items-center justify-end h-full group focus:outline-none" title={`${team.name}: ${formatKpiValue(team.avg, kpiDef.type)}`}>
                        <div className="text-xs font-bold mb-1 text-gray-800 dark:text-gray-200 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                            {formatKpiValue(team.avg, kpiDef.type)}
                        </div>
                        <div className={`w-3/4 max-w-[50px] rounded-t-md transition-all duration-300 ease-out group-hover:opacity-100 opacity-80 group-focus:ring-2 group-focus:ring-sky-500 ${bgColor}`} style={{ height: `${height}%` }} />
                        <div className="text-xs mt-2 text-center truncate w-full text-gray-600 dark:text-gray-400 font-medium">{team.name}</div>
                    </button>
                );
            })}
        </div>
    );
};

const TeamTable: React.FC<{ teams: ExtendedTeam[], kpiDefinitions: KpiDefinition[], onTeamClick: (team: ExtendedTeam) => void }> = ({ teams, kpiDefinitions, onTeamClick }) => {
    const activeKpis = kpiDefinitions.filter(k => k.active);
    return (
        <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left">
                    <thead className="bg-gray-100 dark:bg-gray-900/70">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Equipe / Supervisor</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Operadores</th>
                            {activeKpis.map(kpiDef => (
                                <th key={kpiDef.name} className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">{kpiDef.name} (Média)</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {teams.map(team => {
                            return (
                                <tr key={team.id} onClick={() => onTeamClick(team)} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                    <td className="p-4 font-medium">{team.name}<br/><span className="text-sm text-gray-500 dark:text-gray-400">{team.supervisorName}</span></td>
                                    <td className="p-4">{team.memberCount}</td>
                                    {activeKpis.map(kpiDef => {
                                        const values = team.operators.map(op => op.kpis.find(k => k.name === kpiDef.name)?.value).filter(v => v !== undefined) as number[];
                                        const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
                                        return (
                                            <td key={kpiDef.name} className={`p-4 font-mono font-semibold ${getKpiColor(avg, kpiDef)}`}>
                                                {values.length > 0 ? formatKpiValue(avg, kpiDef.type) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};


// --- Main Dashboard Component ---
const Dashboard: React.FC<{ user: User; onLogout: () => void; profilePic: string | null; setProfilePic: (pic: string | null) => void; }> = ({ user, onLogout, profilePic, setProfilePic }) => {
  const [feedbackState, setFeedbackState] = useState<{isOpen: boolean; initialOperatorId: number | null}>({isOpen: false, initialOperatorId: null});
  const [viewState, setViewState] = useState<{view: 'list' | 'detail', operator: Operator | null}>({view: 'list', operator: null});
  const [kpiDefinitions, setKpiDefinitions] = useState<KpiDefinition[]>(() => getAllKpis());
  const [refreshKey, setRefreshKey] = useState(0); // State to trigger data refresh
  const [csvConfirmation, setCsvConfirmation] = useState<{ file: File; text: string } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<ExtendedTeam | null>(null);


  const supervisorTeamData = useMemo(() => {
    if (user.role === 'Supervisor') return getTeamForSupervisor(user.id);
    return [];
  }, [user.id, user.role, refreshKey]);
  
  const coordinatorTeamData = useMemo(() => {
    if (user.role === 'Coordenador') return getTeamsForCoordinator(user.id);
    return [];
  }, [user.id, user.role, refreshKey]);

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };
  
  const handleDownloadTemplate = () => {
        const csvContent = getTemplateForUser(user);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_kpis.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => importFileRef.current?.click();

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvConfirmation({ file, text });
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    };

    const handleConfirmCsvImport = () => {
        if (!csvConfirmation) return;
        updateDataForUser(user, csvConfirmation.text);
        setRefreshKey(prev => prev + 1); // Trigger refresh
        setCsvConfirmation(null);
    };

    const handleCancelCsvImport = () => {
        setCsvConfirmation(null);
    };


  const handleViewOperatorDetail = (operator: Operator) => {
    setViewState({ view: 'detail', operator });
  };
  
  const handleReturnToList = () => {
    setViewState({ view: 'list', operator: null });
  };
  
  const handleSelectTeam = (team: ExtendedTeam) => {
    setSelectedTeam(team);
  }
  
  const handleReturnToCoordinatorView = () => {
    setSelectedTeam(null);
    setViewState({ view: 'list', operator: null });
  }

  const renderContent = () => {
    if (user.role === 'Administrador') {
        return <AdminDashboard user={user} kpiDefinitions={kpiDefinitions} onKpisChange={() => setKpiDefinitions(getAllKpis())} onDataUpdate={() => setRefreshKey(k => k + 1)} />;
    }
    
    if (viewState.view === 'detail' && viewState.operator) {
        return <OperatorDetailView 
                    operator={viewState.operator} 
                    kpiDefinitions={kpiDefinitions}
                    onBack={handleReturnToList} 
                    onFeedback={(op) => setFeedbackState({isOpen: true, initialOperatorId: op.id})}
                />;
    }

    if (user.role === 'Coordenador') {
        if (selectedTeam) {
            return <TeamPerformanceView 
                user={user}
                teamData={selectedTeam.operators}
                kpiDefinitions={kpiDefinitions}
                onOperatorClick={handleViewOperatorDetail}
                onFeedbackClick={(op) => setFeedbackState({isOpen: true, initialOperatorId: op.id})}
                onNewFeedbackClick={() => setFeedbackState({isOpen: true, initialOperatorId: null})}
                onBack={handleReturnToCoordinatorView}
            />
        }
        return <CoordinatorView
            user={user}
            teams={coordinatorTeamData}
            kpiDefinitions={kpiDefinitions}
            onTeamClick={handleSelectTeam}
            onNewFeedbackClick={() => setFeedbackState({isOpen: true, initialOperatorId: null})}
        />
    }

    if (user.role === 'Supervisor') {
        return <TeamPerformanceView 
            user={user}
            teamData={supervisorTeamData}
            kpiDefinitions={kpiDefinitions}
            onOperatorClick={handleViewOperatorDetail}
            onFeedbackClick={(op) => setFeedbackState({isOpen: true, initialOperatorId: op.id})}
            onNewFeedbackClick={() => setFeedbackState({isOpen: true, initialOperatorId: null})}
        />
    }
    
    return null;
  }
  
  const getPageTitle = () => {
      if (user.role === 'Administrador') return 'Painel de Administração';
      if (user.role === 'Coordenador') {
          return selectedTeam ? `Painel da ${selectedTeam.name}` : 'Painel de Coordenação';
      }
      return 'Painel de Performance';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              {getPageTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Bem-vindo(a), {user.name} ({user.role})</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/50 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <DownloadIcon /> <span className="hidden sm:inline">Baixar Modelo</span>
          </button>
          <button onClick={handleImportClick} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 rounded-md hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors">
             <UploadIcon /> <span className="hidden sm:inline">Atualizar via CSV</span>
          </button>
           <input type="file" ref={importFileRef} onChange={handleFileImport} className="hidden" accept=".csv" />
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
          <ThemeToggleButton />
          <ProfilePicture pic={profilePic} onImageUpload={handleImageUpload} />
          <NotificationBell user={user} />
          <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <LogoutIcon />
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
         {renderContent()}
      </main>
      {feedbackState.isOpen && 
        <FeedbackModal 
            user={user}
            operators={
                user.role === 'Coordenador' 
                    ? (selectedTeam ? selectedTeam.operators : coordinatorTeamData.flatMap(t => t.operators))
                    : supervisorTeamData
            }
            kpiDefinitions={kpiDefinitions} 
            initialOperatorId={feedbackState.initialOperatorId}
            onClose={() => setFeedbackState({isOpen: false, initialOperatorId: null})} 
        />
      }
      {csvConfirmation && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCancelCsvImport}>
                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Atualização</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Você tem certeza que deseja prosseguir com a importação do arquivo <strong>{csvConfirmation.file.name}</strong>?
                        Esta ação irá atualizar os dados dos operadores existentes e criar novos registros, se aplicável.
                    </p>
                    <div className="flex justify-end gap-4">
                        <button onClick={handleCancelCsvImport} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button onClick={handleConfirmCsvImport} className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">Confirmar e Atualizar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// --- Modals ---

const KpiModal: React.FC<{ kpiToEdit?: KpiDefinition | null; onClose: () => void; onSave: (kpi: KpiDefinition) => void; }> = ({ kpiToEdit, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<KpiDefinition['type']>('Porcentagem');
    const [description, setDescription] = useState('');
    const [meta, setMeta] = useState({ critical: 85, regular: 95, inverse: false });
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (kpiToEdit) {
            setName(kpiToEdit.name);
            setType(kpiToEdit.type);
            setDescription(kpiToEdit.description);
            setMeta(kpiToEdit.meta);
            setActive(kpiToEdit.active)
        }
    }, [kpiToEdit]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name: name as any, type, description, active, meta });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{kpiToEdit ? 'Editar KPI' : 'Novo KPI'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nome do KPI (ex: AHT)" value={name} onChange={e => setName(e.target.value)} required disabled={!!kpiToEdit} className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed" />
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <option>Porcentagem</option>
                        <option>Número</option>
                        <option>Tempo</option>
                    </select>
                    <textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" rows={2}/>
                    
                    <fieldset className="border border-gray-300 dark:border-gray-700 p-4 rounded-lg">
                        <legend className="px-2 text-sm text-gray-600 dark:text-gray-400">Configuração de Metas</legend>
                        <div className="grid grid-cols-2 gap-4">
                             <input type="number" placeholder="Meta Regular" value={meta.regular} onChange={e => setMeta(m => ({...m, regular: +e.target.value}))} required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                             <input type="number" placeholder="Meta Crítica" value={meta.critical} onChange={e => setMeta(m => ({...m, critical: +e.target.value}))} required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <input type="checkbox" id="inverse-meta" checked={meta.inverse} onChange={e => setMeta(m => ({...m, inverse: e.target.checked}))} className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sky-600 dark:text-sky-500 focus:ring-sky-500" />
                            <label htmlFor="inverse-meta" className="text-sm text-gray-700 dark:text-gray-300">Lógica Inversa (menor é melhor)</label>
                        </div>
                    </fieldset>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">{kpiToEdit ? 'Salvar Alterações' : 'Salvar KPI'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InviteModal: React.FC<{ userToEdit?: User | null; onClose: () => void; onSave: (user: Omit<User, 'id'>) => void; }> = ({ userToEdit, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>('Supervisor');
    
    useEffect(() => {
        if(userToEdit) {
            setName(userToEdit.name);
            setEmail(userToEdit.email);
            setRole(userToEdit.role);
        } else {
            setName('');
            setEmail('');
            setRole('Supervisor');
        }
    }, [userToEdit]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData = { name, email, role };
        onSave(userData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{userToEdit ? 'Editar Usuário' : 'Convidar Novo Usuário'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                    <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <option>Supervisor</option>
                        <option>Coordenador</option>
                        <option>Administrador</option>
                    </select>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">{userToEdit ? 'Salvar' : 'Enviar Convite'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MessageModal: React.FC<{ recipient: User; onClose: () => void; onSend: (recipient: User, message: string) => void; }> = ({ recipient, onClose, onSend }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(recipient, message);
    };
    
    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enviar mensagem para</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{recipient.name}</p>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea placeholder="Digite sua mensagem aqui..." value={message} onChange={e => setMessage(e.target.value)} required className="w-full p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" rows={5}/>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                        <button type="submit" className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">Enviar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}


export default Dashboard;