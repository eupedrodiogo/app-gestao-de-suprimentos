// Mobile Menu Controller - Versão Simplificada
console.log('📱 Carregando Mobile Menu Controller...');

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - inicializando menu mobile...');
    
    // Busca elementos
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navClose = document.querySelector('.nav-close');
    
    console.log('🔍 Elementos encontrados:');
    console.log('- menuBtn:', menuBtn);
    console.log('- navMenu:', navMenu);
    console.log('- navOverlay:', navOverlay);
    console.log('- navClose:', navClose);
    
    if (!menuBtn || !navMenu) {
        console.error('❌ Elementos essenciais não encontrados!');
        return;
    }
    
    let isMenuOpen = false;
    
    // Função para abrir menu
    function openMenu() {
        console.log('🚀 Abrindo menu...');
        isMenuOpen = true;
        navMenu.classList.add('active');
        menuBtn.classList.add('active');
        if (navOverlay) navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('✅ Menu aberto!');
    }
    
    // Função para fechar menu
    function closeMenu() {
        console.log('🔒 Fechando menu...');
        isMenuOpen = false;
        navMenu.classList.remove('active');
        menuBtn.classList.remove('active');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        console.log('✅ Menu fechado!');
    }
    
    // Função para alternar menu
    function toggleMenu() {
        console.log(`🔄 Toggle menu - Estado atual: ${isMenuOpen ? 'Aberto' : 'Fechado'}`);
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Event listeners para o botão do menu
    menuBtn.addEventListener('click', function(e) {
        console.log('🖱️ Clique no botão detectado!');
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    
    menuBtn.addEventListener('touchend', function(e) {
        console.log('👆 Toque no botão detectado!');
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });
    
    // Event listener para fechar menu
    if (navClose) {
        navClose.addEventListener('click', function(e) {
            console.log('❌ Botão fechar clicado!');
            e.preventDefault();
            closeMenu();
        });
    }
    
    // Event listener para overlay
    if (navOverlay) {
        navOverlay.addEventListener('click', function(e) {
            console.log('🌫️ Overlay clicado!');
            e.preventDefault();
            closeMenu();
        });
    }
    
    // Event listener para links do menu
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('🔗 Link do menu clicado!');
            closeMenu();
        });
    });
    
    // Event listener para redimensionamento
    window.addEventListener('resize', function() {
        if (window.innerWidth > 991.98 && isMenuOpen) {
            console.log('📏 Tela redimensionada - fechando menu');
            closeMenu();
        }
    });
    
    console.log('✅ Mobile Menu Controller inicializado com sucesso!');
});

console.log('📱 Mobile Menu Controller carregado!');