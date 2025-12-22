document.addEventListener('DOMContentLoaded', function() {
    var nav = document.querySelector('nav');
    if (nav) {
        var container = document.createElement('div');
        container.className = 'sidebar-logo-container';

        var logo = document.createElement('img');
        logo.src = 'qucat-logo.png';
        logo.alt = 'QuCat Logo';
        logo.className = 'sidebar-logo';
        
        var title = document.createElement('div');
        title.textContent = 'JSCircuit';
        title.className = 'sidebar-title';

        container.appendChild(logo);
        container.appendChild(title);
        
        // Insert before the first child
        nav.insertBefore(container, nav.firstChild);
    }
});
