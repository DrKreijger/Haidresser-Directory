
document.addEventListener('DOMContentLoaded', async function initializePage() {
    const coiffeursTemplate = document.getElementById('listeCoiffeursTemplate');
    const coiffeursContainer = document.getElementById('coiffeursContainer');
    const resultCountElement = document.getElementById('resultCount');
    const coiffeurDetailsContainer = document.getElementById('coiffeur-Details-Container');
    const coiffeurDetails= document.getElementById('coiffeur-Details');
    const detailsNom = document.getElementById('valeursNom');
    const detailsNumero = document.getElementById('valeursNumero');
    const detailsVoie = document.getElementById('valeursVoie');
    const detailsCodePostal = document.getElementById('valeursCodePostal');
    const detailsVille = document.getElementById('valeursVille');
    const contentContainer = document.getElementById('content-Container')
    const mapContainer = document.getElementById('map');
    const loginButton = document.getElementById('loginBtn');
    const logoutButton = document.getElementById('logoutBtn');
    const addCoiffeurButton = document.getElementById('addCoiffeurBtn');
    const editDetailsContainer = document.getElementById('edit-Details-Container');
    const saveBtn = document.getElementById('saveBtn');
    const addBtn = document.getElementById('addBtn');
    const addCoiffeurContainer = document.getElementById('add-Coiffeur-Container');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    let currentPage = 1;
    let loading = false;
    let totalCount = 0;
    let currentSearch = '';
    let coiffeurIndex = 1;
    let selectedCoiffeurId = null;


    mapboxgl.accessToken = 'pk.eyJ1IjoiZHJrcmVpamdlciIsImEiOiJjbHFxaTNsdmgyMW82MmtwOWE1NGQ2ajVhIn0.yvB4SifMHKbr5W-AjlWW1A';
    const map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        zoom: 16.5
    });
    let marker = new mapboxgl.Marker()


    await loadCoiffeurs();

    // Fonction pour charger les coiffeurs
    async function loadCoiffeurs() {
        const response = await fetch(`http://localhost:3000/coiffeurs?search=${encodeURIComponent(currentSearch)}&page=${currentPage}`);
        const data = await response.json();

        const coiffeurs = data.coiffeurs || [];

        if (coiffeurs.length === 0) {
            resultCountElement.textContent = 'Aucun résultat trouvé.';
        } else {
            totalCount = data.totalCount;
            resultCountElement.textContent = `${totalCount} coiffeurs trouvés`;

            coiffeurs.forEach(coiffeur => {
                if (coiffeursTemplate.content) {
                    const clone = document.importNode(coiffeursTemplate.content, true);

                    clone.querySelector('.nomCoiffeur').textContent = coiffeur.nom;
                    clone.querySelector('.rueEtNumero').textContent = `${coiffeur.num} ${coiffeur.voie}`;
                    clone.querySelector('.ville-code_postale').textContent = `  ${coiffeur.codepostal} ${coiffeur.ville}`;
                    clone.querySelector('.indexCoiffeur').textContent = coiffeurIndex++;

                    const latitude = coiffeur.lat;
                    const longitude = coiffeur.long;
                    const coiffeurId = coiffeur.coiffeurid;

                    clone.querySelector('.coiffeursListe').setAttribute('data-latitude', latitude);
                    clone.querySelector('.coiffeursListe').setAttribute('data-longitude', longitude);
                    clone.querySelector('.coiffeursListe').setAttribute('data-coiffeurid', coiffeurId);

                    const idCoiffeurElement = clone.querySelector('.indexCoiffeur');
                    if (clone.classList && clone.classList.contains('selected')) {
                        idCoiffeurElement.classList.add('selected-idCoiffeur');
                    }

                    coiffeursContainer.appendChild(clone);
                }
            });
            currentPage++;
            loading = false;
        }
    }

    // Fonction pour mettre à jour les détails du coiffeur dans la liste
    async function updateCoiffeurElement(updatedCoiffeur) {

        if (selectedCoiffeurId && updatedCoiffeur) {
            const coiffeurElement = document.querySelector(`.coiffeursListe[data-coiffeurid="${selectedCoiffeurId}"]`);

            if (coiffeurElement) {
                console.log('coiffeurElement trouvé:', coiffeurElement);
                // Met à jour le contenu de l'élément coiffeur
                coiffeurElement.querySelector('.nomCoiffeur').textContent = updatedCoiffeur.nom;
                coiffeurElement.querySelector('.rueEtNumero').textContent = `${updatedCoiffeur.num} ${updatedCoiffeur.voie}`;
                coiffeurElement.querySelector('.ville-code_postale').textContent = `${updatedCoiffeur.codepostal} ${updatedCoiffeur.ville}`;
                coiffeurElement.setAttribute('data-latitude', updatedCoiffeur.lat);
                coiffeurElement.setAttribute('data-longitude', updatedCoiffeur.long);

                const latitude = parseFloat(coiffeurElement.getAttribute('data-latitude'));
                const longitude = parseFloat(coiffeurElement.getAttribute('data-longitude'));
                map.resize();
                map.jumpTo({center: [longitude, latitude], zoom: 16.5});
                marker.setLngLat([longitude, latitude]).addTo(map);
                marker.addTo(map);
                console.log('Mise à jour de l\'élément coiffeur réussie.');
            } else {
                console.error('L\'élément coiffeur avec l\'ID sélectionné n\'a pas été trouvé.');
            }
        } else {
            console.error('L\'ID du coiffeur sélectionné ou updatedCoiffeur est undefined.');
        }
    }

    // Fonction pour récupérer l'id du coiffeur sélectionné
    function getSelectedCoiffeurId() {
        const selectedCoiffeurElement = document.querySelector('.coiffeursListe.selected');
        return selectedCoiffeurElement ? selectedCoiffeurElement.getAttribute('data-coiffeurid') : null;
    }

    // Fonction pour la barre de recherche
    async function handleSearchInput() {
        currentPage = 1;
        coiffeursContainer.innerHTML = '';
        totalCount = 0;
        coiffeurIndex = 1;
        currentSearch = searchInput.value;
        coiffeurDetailsContainer.style.visibility = 'hidden';
        coiffeurDetailsContainer.style.transform = 'translateX(100%)';
        coiffeurDetailsContainer.style.display = 'none';
        contentContainer.classList.remove('details-visible');
        coiffeurDetails.classList.remove('details-visible');
        document.querySelectorAll('.coiffeursListe').forEach(element => {
            element.classList.remove('selected');
        });

        await loadCoiffeurs();
    }

    // Afficher les détails du coiffeur
    function showCoiffeurDetails(selectedCoiffeur, coiffeurElement) {

        // Afficher les détails du coiffeur avec une animation de glissement
        coiffeurDetails.style.display = 'block';
        detailsNom.textContent = selectedCoiffeur.nom;
        detailsNumero.textContent = getNumero(selectedCoiffeur.rueEtNumero);
        detailsVoie.textContent = getVoie(selectedCoiffeur.rueEtNumero);
        detailsCodePostal.textContent = getCodePostal(selectedCoiffeur.villeCodePostal);
        detailsVille.textContent = getVille(selectedCoiffeur.villeCodePostal);

        coiffeurDetailsContainer.style.display = 'flex';
        coiffeurDetailsContainer.style.visibility = 'visible';
        coiffeurDetailsContainer.style.transform = 'translateX(0%)';
        coiffeurDetails.classList.add('details-visible');
        contentContainer.classList.add('details-visible');
        mapContainer.style.display = 'flex';
        addCoiffeurContainer.style.display = 'none';

        // Récupère les coordonnées depuis l'élément sélectionné
        const latitude = parseFloat(coiffeurElement.getAttribute('data-latitude'));
        const longitude = parseFloat(coiffeurElement.getAttribute('data-longitude'));

        map.resize();
        map.jumpTo({center: [longitude, latitude], zoom: 16.5});
        marker.setLngLat([longitude, latitude]).addTo(map);
        marker.addTo(map);
    }

    // Afficher les détails du coiffeur à modifier
    function showCoiffeurDetailsEdit(selectedCoiffeur, coiffeurElement) {
        coiffeurDetailsContainer.style.display = 'flex';
        coiffeurDetailsContainer.style.visibility = 'visible';
        coiffeurDetailsContainer.style.transform = 'translateX(0%)';
        editDetailsContainer.style.display = 'block';
        coiffeurDetails.style.display = 'none';
        mapContainer.style.display = 'flex';
        addCoiffeurContainer.style.display = 'none';
        contentContainer.classList.add('details-visible');
        const latitude = parseFloat(coiffeurElement.getAttribute('data-latitude'));
        const longitude = parseFloat(coiffeurElement.getAttribute('data-longitude'));
        document.getElementById('nomCoiffeurEdit').value = selectedCoiffeur.nom;
        document.getElementById('numeroCoiffeurEdit').value = getNumero(selectedCoiffeur.rueEtNumero);
        document.getElementById('voieCoiffeurEdit').value = getVoie(selectedCoiffeur.rueEtNumero);
        document.getElementById('codePostalCoiffeurEdit').value = getCodePostal(selectedCoiffeur.villeCodePostal);
        document.getElementById('villeCoiffeurEdit').value = getVille(selectedCoiffeur.villeCodePostal);
        document.getElementById('latCoiffeurEdit').value = latitude;
        document.getElementById('longCoiffeurEdit').value = longitude;
        map.resize();
        map.jumpTo({center: [longitude, latitude], zoom: 16.5});
        marker.setLngLat([longitude, latitude]).addTo(map);
        marker.addTo(map);
    }

    // Evenement de clic sur le bouton de mise à jour
    saveBtn.addEventListener('click', () => {
        const updatedCoiffeur = {
            nom: document.getElementById('nomCoiffeurEdit').value,
            lat: document.getElementById('latCoiffeurEdit').value,
            long: document.getElementById('longCoiffeurEdit').value,
            num: document.getElementById('numeroCoiffeurEdit').value,
            voie: document.getElementById('voieCoiffeurEdit').value,
            ville: document.getElementById('villeCoiffeurEdit').value,
            codepostal: document.getElementById('codePostalCoiffeurEdit').value
        };

        console.log('Données envoyées pour la mise à jour :', updatedCoiffeur);
        console.log('ID du coiffeur à mettre à jour :', selectedCoiffeurId);
        const modifyPromise = fetch(`http://localhost:3000/coiffeurs/${selectedCoiffeurId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedCoiffeur),
        })
            .then(response => response.text())
            .then((data) => {
                console.log('Réponse du serveur après modification :', data);
                updateCoiffeurElement(updatedCoiffeur);
            })
            .catch((error) => {
                console.error('Erreur lors de la modification:', error);
            });
    });

    // Evenement de clic pour l'interface d'ajout de coiffeur
    addCoiffeurButton.addEventListener('click', () => {
        coiffeurDetailsContainer.style.display = 'flex';
        coiffeurDetailsContainer.style.visibility = 'visible';
        coiffeurDetailsContainer.style.transform = 'translateX(0%)';
        addCoiffeurContainer.style.display = 'block';
        coiffeurDetails.style.display = 'none';
        editDetailsContainer.style.display = 'none';
        mapContainer.style.display = 'none';
        contentContainer.classList.add('details-visible');
    });

    // Evenement de clic sur le bouton d'ajout
    addBtn.addEventListener('click', () => {
        const newCoiffeur = {
            nom: document.getElementById('nomCoiffeurAdd').value,
            lat: document.getElementById('latCoiffeurAdd').value,
            long: document.getElementById('longCoiffeurAdd').value,
            num: document.getElementById('numeroCoiffeurAdd').value,
            voie: document.getElementById('voieCoiffeurAdd').value,
            ville: document.getElementById('villeCoiffeurAdd').value,
            codepostal: document.getElementById('codePostalCoiffeurAdd').value
        };
        const addPromise = fetch(`http://localhost:3000/coiffeurs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newCoiffeur),
        })
            .then(response => response.text())
            .then((data) => {
                console.log('Réponse du serveur après ajout :', data);
                alert('Coiffeur ajouté')
                window.location.reload();
            })
            .catch((error) => {
                console.error('Erreur lors de l\'ajout:', error);
            });
    });

    // Fonction utilitaire pour extraire le numéro de rue
    function getNumero(rueEtNumero) {
        const numeroMatch = rueEtNumero.match(/\b\d+\b/);
        return numeroMatch ? numeroMatch[0] : '';
    }

    // Fonction utilitaire pour extraire la voie
    function getVoie(rueEtNumero) {
        const voieMatch = rueEtNumero.replace(/\b\d+\b/, '').trim();
        return voieMatch;
    }

    // Fonction utilitaire pour extraire le code postal
    function getCodePostal(villeCodePostal) {
        const codePostalMatch = villeCodePostal.match(/\b\d{5}\b/);
        return codePostalMatch ? codePostalMatch[0] : '';
    }

    // Fonction utilitaire pour extraire la ville
    function getVille(villeCodePostal) {
        const villeMatch = villeCodePostal.replace(/\b\d{5}\b/, '').trim();
        return villeMatch;
    }

    // Gérer l'événement de défilement
    contentContainer.onscroll = function() {
        const scrollHeight = contentContainer.scrollHeight;
        const scrollTop = contentContainer.scrollTop;
        const clientHeight = contentContainer.clientHeight;

        if (scrollHeight - scrollTop - clientHeight < 100 && !loading && coiffeurIndex <= totalCount) {
            loading = true;
            loadCoiffeurs();
        }
    };

    // Gérer l'événement de saisie dans la barre de recherche
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearchInput);



    // Ajout de l'événement de clic sur un coiffeur pour afficher les détails
    coiffeursContainer.addEventListener('click', function handleClick(event) {
        const coiffeurElement = event.target.closest('.coiffeursListe');
        if (coiffeurElement) {
            document.querySelectorAll('.coiffeursListe').forEach(element => {
                element.classList.remove('selected');
            });

            const selectedCoiffeur = {
                nom: coiffeurElement.querySelector('.nomCoiffeur').textContent,
                rueEtNumero: coiffeurElement.querySelector('.rueEtNumero').textContent,
                villeCodePostal: coiffeurElement.querySelector('.ville-code_postale').textContent,
            };
            coiffeurElement.classList.add('selected');
            if(isUserLoggedIn()){
                showCoiffeurDetailsEdit(selectedCoiffeur, coiffeurElement);
            }else {
                showCoiffeurDetails(selectedCoiffeur, coiffeurElement);
            }
            // Change la couleur de l'idCoiffeur sélectionné
            const indexCoiffeurElement = coiffeurElement.querySelector('.indexCoiffeur');
            indexCoiffeurElement.classList.add('selected-idCoiffeur');
            selectedCoiffeurId = getSelectedCoiffeurId();
        }
    });

    // Ajout de l'événement de clic sur le bouton de connexion
    loginButton.addEventListener('click', function() {
        window.location.href = 'login.html';
    });

    // Ajout de l'événement de clic sur le bouton de déconnexion
    logoutButton.addEventListener('click', function() {
        // Déconnexion réussie, mettre à jour le statut isLoggedIn dans le localStorage
        localStorage.removeItem('token');
        window.location.reload();
    });

    // Fonction pour récupérer le token du localStorage
    function getTokenFromLocalStorage() {
        return localStorage.getItem('token');
    }

    // Fonction pour vérifier si l'utilisateur est connecté
    function isUserLoggedIn() {
        const token = getTokenFromLocalStorage();
        if (token) {
            loginButton.style.display = 'none';
            logoutButton.style.display = 'flex';
            addCoiffeurButton.style.display = 'flex';
            return true;
        }else {
            loginButton.style.display = 'flex';
            logoutButton.style.display = 'none';
            addCoiffeurButton.style.display = 'none';
            return false;
        }
    }

    // Ajout de l'événement de clic sur le bouton de fermeture des détails
    closeDetailsBtn.addEventListener('click', () => {
        coiffeurDetailsContainer.style.visibility = 'hidden';
        coiffeurDetailsContainer.style.transform = 'translateX(100%)';
        coiffeurDetailsContainer.style.display = 'none';
        contentContainer.classList.remove('details-visible');
        coiffeurDetails.classList.remove('details-visible');
        document.querySelectorAll('.coiffeursListe').forEach(element => {
            element.classList.remove('selected');
        });
        addCoiffeurContainer.style.display = 'none';
    });
    isUserLoggedIn();
});