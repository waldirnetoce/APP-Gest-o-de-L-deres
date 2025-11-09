import React, { useState, useMemo } from 'react';
import { Operator, KpiDefinition, KPI, User, KpiType } from './api';
// Fix: Added UserGroupIcon to imports.
import { CloseIcon, DocumentTextIcon, UserCircleIcon, UserGroupIcon } from './components/icons';

interface FeedbackModalProps {
  user: User;
  operators: Operator[];
  kpiDefinitions: KpiDefinition[];
  initialOperatorId?: number | null;
  onClose: () => void;
}

// Helper functions (could be moved to a utils file)
const formatKpiValue = (value: number, type: KpiType): string => {
    switch(type) {
        case 'Porcentagem': return `${value.toFixed(1)}%`;
        case 'Tempo': return `${Math.floor(value / 60)}:${(value % 60).toFixed(0).padStart(2, '0')}`;
        case 'Número': return value.toFixed(1);
        default: return value.toString();
    }
};

const getKpiColor = (kpi: KPI, definitions: KpiDefinition[]): string => {
  const config = definitions.find(d => d.name === kpi.name);
  if (!config) return 'text-gray-600 dark:text-gray-300';
  if (!config.active) return 'text-gray-400 dark:text-gray-500';

  if (config.meta.inverse) {
    if (kpi.value <= config.meta.regular) return 'text-green-600 dark:text-green-400';
    if (kpi.value <= config.meta.critical) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  } else {
    if (kpi.value >= config.meta.regular) return 'text-green-600 dark:text-green-400';
    if (kpi.value >= config.meta.critical) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
};


const FeedbackModal: React.FC<FeedbackModalProps> = ({ user, operators, kpiDefinitions, initialOperatorId, onClose }) => {
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<number[]>(initialOperatorId ? [initialOperatorId] : []);
  
  const [positivePoints, setPositivePoints] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');
  const [actionPlan, setActionPlan] = useState('');

  const selectedOperators = useMemo(() => 
    operators.filter(op => selectedOperatorIds.includes(op.id)),
    [selectedOperatorIds, operators]
  );
  
  const handleOperatorToggle = (operatorId: number) => {
    setSelectedOperatorIds(prev => 
      prev.includes(operatorId)
        ? prev.filter(id => id !== operatorId)
        : [operatorId] // NOTE: Changed to single-select for cleaner UI. To enable multi-select, change this to [...prev, operatorId]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      gestor: user.name,
      operadores: selectedOperators.map(op => op.name),
      positivePoints,
      improvementPoints,
      actionPlan,
    });
    alert('Feedback enviado! (Verifique o console do navegador)');
    onClose();
  };

  const generatePdfContent = () => {
    if (selectedOperators.length === 0) return '';
    
    const operator = selectedOperators[0];
    const date = new Date().toLocaleDateString('pt-BR');
    
    const operatorKpisHtml = operator.kpis
        .filter(kpi => kpiDefinitions.find(d => d.name === kpi.name)?.active)
        .map(kpi => `
            <div class="kpi-item">
                <div class="kpi-name">${kpi.name}</div>
                <div class="kpi-value">${formatKpiValue(kpi.value, kpi.type)}</div>
            </div>
        `).join('');

    return `
        <html>
            <head>
                <title>Relatório de Feedback - ${operator.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 2rem; color: #333; }
                    h1 { color: #0284c7; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
                    h2 { color: #1f2937; margin-top: 2rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem;}
                    .header-info { margin-bottom: 2rem; }
                    .feedback-section { margin-bottom: 1.5rem; white-space: pre-wrap; background: #f9fafb; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb; min-height: 40px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
                    .kpi-item { border: 1px solid #e5e7eb; padding: 0.75rem; border-radius: 8px; text-align: center; }
                    .kpi-name { font-size: 0.9rem; color: #6b7280; }
                    .kpi-value { font-weight: bold; font-size: 1.5rem; }
                    .signatures { display: flex; justify-content: space-around; margin-top: 4rem; }
                    .signature-box { text-align: center; width: 40%; }
                    .signature-line { border-bottom: 1px solid #333; margin-bottom: 0.5rem; }
                    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; text-align: center; font-size: 0.8rem; color: #9ca3af; }
                </style>
            </head>
            <body>
                <h1>Relatório de Feedback</h1>
                <div class="header-info">
                    <p><strong>Data:</strong> ${date}</p>
                    <p><strong>Gestor:</strong> ${user.name}</p>
                    <p><strong>Operador(a):</strong> ${operator.name}</p>
                </div>

                <h2>Desempenho Atual (KPIs)</h2>
                <div class="kpi-grid">${operatorKpisHtml}</div>

                <h2>Pontos Positivos</h2>
                <div class="feedback-section">${positivePoints.replace(/\n/g, '<br>') || 'Nenhum ponto positivo destacado.'}</div>

                <h2>Pontos a Desenvolver</h2>
                <div class="feedback-section">${improvementPoints.replace(/\n/g, '<br>') || 'Nenhum ponto a desenvolver destacado.'}</div>

                <h2>Plano de Ação</h2>
                <div class="feedback-section">${actionPlan.replace(/\n/g, '<br>') || 'Nenhum plano de ação definido.'}</div>

                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>${user.name}</p>
                        <p>(Supervisor)</p>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <p>${operator.name}</p>
                        <p>(Operador)</p>
                    </div>
                </div>

                <footer>Gerado por KPI Manager</footer>
            </body>
        </html>
    `;
  };
  
  const handlePrint = () => {
    const content = generatePdfContent();
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      // Use a timeout to ensure content is rendered before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      alert('Por favor, habilite pop-ups para exportar o PDF.');
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[90vh] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Formulário de Feedback</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><CloseIcon /></button>
        </div>
        
        <div className="flex-grow flex flex-col md:flex-row gap-6 p-6 overflow-y-auto">
            {/* Left: Operator Selection */}
            <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 pr-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Selecione o Operador</h3>
                <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {operators.map(op => (
                        <div key={op.id} onClick={() => handleOperatorToggle(op.id)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedOperatorIds.includes(op.id) ? 'bg-sky-100 dark:bg-sky-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                            <input
                                type="checkbox"
                                checked={selectedOperatorIds.includes(op.id)}
                                readOnly
                                className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sky-600 focus:ring-sky-500"
                            />
                            <UserCircleIcon className="h-8 w-8 text-gray-400" />
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{op.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{op.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Feedback Form & KPIs */}
            <div className="w-full md:w-2/3">
                {selectedOperators.length === 1 ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Resumo de KPIs de {selectedOperators[0].name}</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {selectedOperators[0].kpis.filter(kpi => kpiDefinitions.find(d => d.name === kpi.name)?.active).map(kpi => (
                                     <div key={kpi.name} className="bg-gray-100 dark:bg-gray-900/70 p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{kpi.name}</p>
                                        <p className={`text-xl font-bold font-mono ${getKpiColor(kpi, kpiDefinitions)}`}>
                                            {formatKpiValue(kpi.value, kpi.type)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
                             <div>
                                <label htmlFor="positive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pontos Positivos</label>
                                <textarea id="positive" value={positivePoints} onChange={e => setPositivePoints(e.target.value)} rows={3} className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" />
                            </div>
                            <div>
                                <label htmlFor="improvement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pontos a Desenvolver</label>
                                <textarea id="improvement" value={improvementPoints} onChange={e => setImprovementPoints(e.target.value)} rows={3} className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" />
                            </div>
                            <div>
                                <label htmlFor="action-plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plano de Ação</label>
                                <textarea id="action-plan" value={actionPlan} onChange={e => setActionPlan(e.target.value)} rows={3} className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none" />
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <UserGroupIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhum operador selecionado</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Selecione um operador à esquerda para começar.</p>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-4">
          <button onClick={handlePrint} disabled={selectedOperators.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/50 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <DocumentTextIcon /> Exportar PDF
          </button>
          <button type="submit" form="feedback-form" disabled={selectedOperators.length === 0} className="px-6 py-2 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-gray-500 dark:disabled:bg-gray-600">Enviar Feedback</button>
        </div>
      </div>
    </div>
  );
};

// Fix: Added default export.
export default FeedbackModal;