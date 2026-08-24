// frontend/js/toast.js

/**
 * Sistema Global de Notificações Toast do Connect Senac
 * Suporta tipos: 'success', 'error', 'warning', 'info'
 */
(function() {
    // Garante que o container de toasts existe na página
    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0';
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const STYLES = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-500/10',
        error: 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-500/10',
        warning: 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-500/10',
        info: 'bg-sky-50 border-sky-200 text-sky-900 shadow-sky-500/10'
    };

    const TITLE_COLORS = {
        success: 'text-emerald-800',
        error: 'text-rose-800',
        warning: 'text-amber-800',
        info: 'text-sky-800'
    };

    window.showToast = function(mensagem, tipo = 'info', titulo = '') {
        const container = ensureContainer();
        const toastType = STYLES[tipo] ? tipo : 'info';
        
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 transform translate-x-10 opacity-0 ${STYLES[toastType]}`;
        
        const defaultTitles = {
            success: 'Sucesso',
            error: 'Atenção',
            warning: 'Aviso',
            info: 'Informação'
        };

        const headerTitle = titulo || defaultTitles[toastType];

        toast.innerHTML = `
            <span class="text-lg flex-shrink-0 mt-0.5">${ICONS[toastType]}</span>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold ${TITLE_COLORS[toastType]} uppercase tracking-wider">${headerTitle}</h4>
                <p class="text-xs text-slate-700 mt-0.5 leading-relaxed break-words">${mensagem}</p>
            </div>
            <button type="button" class="text-slate-400 hover:text-slate-700 text-sm font-bold ml-2 transition" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-10', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Auto-remoção após 4 segundos
        setTimeout(() => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-10', 'opacity-0');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, 4000);
    };
})();
