// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    const game = new Game();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        game.canvas.width = window.innerWidth;
        game.canvas.height = window.innerHeight;
    });
});

// Global function for menu toggling
function toggleMenu(menuId) {
    const content = document.getElementById(menuId);
    const toggleIcon = document.getElementById(menuId.replace('-content', '-toggle'));
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        toggleIcon.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        content.style.maxHeight = '0px';
        toggleIcon.classList.add('collapsed');
    }
}