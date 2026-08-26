// frontend/js/utils/sanitize.js

/**
 * Utilitário global para sanitização e escape de strings HTML.
 * Previne vulnerabilidades de Stored XSS e DOM XSS.
 */
(function() {
    window.escapeHTML = function(str) {
        if (str === null || str === undefined) return '';
        if (typeof str !== 'string') str = String(str);
        return str.replace(/[&<>'"]/g, function(tag) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag;
        });
    };
})();
