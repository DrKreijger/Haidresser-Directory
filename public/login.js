document.getElementById('cancelBtn').addEventListener('click', function() {
    window.location.href = '/'; // Redirection vers le point d'entrée principal
});

document.getElementById('loginBtn').addEventListener('click', async function() {
    // Vérifier les informations d'identification
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    try {
        // Envoyer les informations d'identification au serveur
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: emailInput,
                password: passwordInput,
            }),
        });

        if (response.ok) {
            // Récupérer le token du serveur
            const { token } = await response.json();

            // Stocker le token dans un endroit sécurisé, par exemple, un cookie HTTPOnly
            localStorage.setItem('token', token);

            // Redirection vers la page principale
            window.location.href = '/';
        } else {
            // Gérer les erreurs d'authentification
            const errorData = await response.json();
            alert('Mauvais login et/ou mot de passe')
            console.log(`Erreur d'authentification: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Erreur lors de la requête d\'authentification:', error);
    }
});