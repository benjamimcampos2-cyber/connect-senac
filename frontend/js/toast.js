// frontend/js/toast.js

/**
 * Sistema Global de Notificações Toast do Connect Senac
 * Suporta tipos: 'success', 'error', 'warning', 'info'
 */
(function() {
    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS_SVG = {
        success: `<svg class="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`,
        error: `<svg class="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`,
        warning: `<svg class="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
        info: `<svg class="w-5 h-5 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    const STYLES = {
        success: 'bg-white/95 border-emerald-200 text-emerald-950 shadow-soft-xl shadow-emerald-900/10',
        error: 'bg-white/95 border-rose-200 text-rose-950 shadow-soft-xl shadow-rose-900/10',
        warning: 'bg-white/95 border-amber-200 text-amber-950 shadow-soft-xl shadow-amber-900/10',
        info: 'bg-white/95 border-brand-200 text-brand-950 shadow-soft-xl shadow-brand-900/10'
    };

    const TITLE_COLORS = {
        success: 'text-emerald-700',
        error: 'text-rose-700',
        warning: 'text-amber-700',
        info: 'text-brand-700'
    };

    window.showToast = function(mensagem, tipo = 'info', titulo = '') {
        const container = ensureContainer();
        const toastType = STYLES[tipo] ? tipo : 'info';
        
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 transform translate-x-10 opacity-0 ${STYLES[toastType]}`;
        toast.setAttribute('role', toastType === 'error' ? 'alert' : 'status');
        
        const defaultTitles = {
            success: 'Sucesso',
            error: 'Atenção',
            warning: 'Aviso',
            info: 'Informação'
        };

        const headerTitle = titulo || defaultTitles[toastType];

        toast.innerHTML = `
            <div class="mt-0.5">${ICONS_SVG[toastType]}</div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-bold ${TITLE_COLORS[toastType]} uppercase tracking-wider">${headerTitle}</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">${mensagem}</p>
            </div>
            <button type="button" class="text-slate-400 hover:text-slate-700 p-1 text-xs rounded-lg hover:bg-slate-100 transition-colors" aria-label="Fechar notificação" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-10', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Auto-remoção suave após 4.5 segundos
        setTimeout(() => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-10', 'opacity-0');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, 4500);
    };
})();
