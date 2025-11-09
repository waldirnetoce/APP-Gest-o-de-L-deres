import React, { useState } from 'react';
import { performInitialSetup } from './api';
import { ArrowRightIcon, CheckCircleIcon, TrashIcon, UserGroupIcon } from './components/icons';

type Step = 1 | 2 | 3 | 4;
interface NewUser { name: string; email: string; }
interface NewSupervisor extends NewUser { coordinatorId: number; }

// Simple hash for temporary ID, API will create real IDs
const hashCode = (s: string): number => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};


const SetupWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState<Step>(1);
    const [coordinators, setCoordinators] = useState<NewUser[]>([]);
    const [supervisors, setSupervisors] = useState<NewSupervisor[]>([]);

    const handleFinishSetup = () => {
        performInitialSetup({coordinators, supervisors});
        setStep(4);
        setTimeout(onComplete, 3000); // Go to login screen after a delay
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <WelcomeStep onNext={() => setStep(2)} />;
            case 2:
                return <CoordinatorStep onNext={() => setStep(3)} coordinators={coordinators} setCoordinators={setCoordinators} />;
            case 3:
                return <SupervisorStep onNext={handleFinishSetup} onBack={() => setStep(2)} supervisors={supervisors} setSupervisors={setSupervisors} coordinators={coordinators} />;
            case 4:
                return <FinishStep />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-500">
                {renderStep()}
            </div>
        </div>
    );
};

// --- Step Components ---

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
    <div className="text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 mb-4">
            Bem-vindo ao KPI Manager!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Vamos começar configurando a hierarquia da sua equipe. Este assistente irá guiá-lo no cadastro dos seus Coordenadores e Supervisores.</p>
        <button onClick={onNext} className="w-full sm:w-auto flex items-center justify-center gap-2 mx-auto px-8 py-3 text-lg font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-500/50">
            Começar Configuração <ArrowRightIcon />
        </button>
    </div>
);

const CoordinatorStep: React.FC<{ onNext: () => void; coordinators: NewUser[]; setCoordinators: React.Dispatch<React.SetStateAction<NewUser[]>>; }> = ({ onNext, coordinators, setCoordinators }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email) {
            setCoordinators(prev => [...prev, { name, email }]);
            setName('');
            setEmail('');
        }
    };
    
    const handleRemove = (emailToRemove: string) => {
        setCoordinators(prev => prev.filter(c => c.email !== emailToRemove));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Passo 1: Cadastrar Coordenadores</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Adicione os usuários que terão a visão de Coordenador.</p>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 mb-6">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Coordenador" required className="flex-grow p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required className="flex-grow p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                <button type="submit" className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">Adicionar</button>
            </form>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {coordinators.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{c.email}</p>
                        </div>
                        <button onClick={() => handleRemove(c.email)} className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={onNext} disabled={coordinators.length === 0} className="flex items-center justify-center gap-2 px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Próximo Passo <ArrowRightIcon />
                </button>
            </div>
        </div>
    );
};

const SupervisorStep: React.FC<{ onNext: () => void; onBack: () => void; supervisors: NewSupervisor[]; setSupervisors: React.Dispatch<React.SetStateAction<NewSupervisor[]>>; coordinators: NewUser[]; }> = ({ onNext, onBack, supervisors, setSupervisors, coordinators }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [coordinatorId, setCoordinatorId] = useState<number>(coordinators[0] ? hashCode(coordinators[0].email) : 0);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && email && coordinatorId) {
            setSupervisors(prev => [...prev, { name, email, coordinatorId }]);
            setName('');
            setEmail('');
        }
    };
    
    const handleRemove = (emailToRemove: string) => {
        setSupervisors(prev => prev.filter(s => s.email !== emailToRemove));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Passo 2: Cadastrar Supervisores</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Adicione os Supervisores e vincule-os a um Coordenador.</p>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Supervisor" required className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg" />
                <select value={coordinatorId} onChange={e => setCoordinatorId(Number(e.target.value))} required className="p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                    {coordinators.map((c, i) => (
                         <option key={i} value={hashCode(c.email)}>{c.name}</option>
                    ))}
                </select>
                <div className="md:col-span-3">
                     <button type="submit" className="w-full px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700">Adicionar Supervisor</button>
                </div>
            </form>
             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {supervisors.map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{s.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{s.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-700 dark:text-gray-300">Coord: {coordinators.find(c => hashCode(c.email) === s.coordinatorId)?.name}</span>
                            <button onClick={() => handleRemove(s.email)} className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"><TrashIcon className="h-5 w-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-between">
                <button onClick={onBack} className="px-6 py-2 text-gray-800 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Voltar</button>
                <button onClick={onNext} disabled={supervisors.length === 0} className="flex items-center justify-center gap-2 px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Finalizar Configuração
                </button>
            </div>
        </div>
    );
};

const FinishStep: React.FC = () => (
    <div className="text-center py-8">
        <CheckCircleIcon className="mx-auto text-green-500 dark:text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuração Concluída!</h2>
        <p className="text-gray-600 dark:text-gray-400">A hierarquia da sua equipe foi salva. Você será redirecionado para a tela de login.</p>
    </div>
);


export default SetupWizard;