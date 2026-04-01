// Authentication check for protected pages
(function() {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

    if (!isLoginPage && !isLoggedIn) {
        // Not logged in and trying to access protected page
        window.location.href = '/login.html';
    }
})();

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminUsername');
        window.location.href = '/login.html';
    }
}

// Get current admin username
function getAdminUsername() {
    return sessionStorage.getItem('adminUsername') || 'Admin';
}
