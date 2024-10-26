document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    // Gestions des bouton de navigation
    document.querySelector('#inbox').addEventListener('click', () => load_emails('inbox'));
    document.querySelector('#sent').addEventListener('click', () =>  load_emails('sent'));
    document.querySelector('#archived').addEventListener('click',() => load_emails('archived'));
    document.querySelector('#compose').addEventListener('click', () => showComposeView());

    // Envoyer un email
    document.querySelector('#compose-form').addEventListener('submit', (event) => sendEmail(event));

    // Par défaut, charger la boîte de réception
    load_emails('inbox');
});


function hideAllViews() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-detail-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
}

function load_emails(mailbox) {
    // Masquer toutes les vues actuelles
    hideAllViews();

    // Afficher la vue de la boîte de réception
    document.querySelector('#emails-view').style.display = 'block';

    // Réinitialiser le contenu de la vue
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Récupérer les emails depuis le serveur
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            // Afficher chaque email
            emails.forEach(email => {
                const emailElement = document.createElement('div');
                emailElement.className = `list-group-item ${email.read ? 'read' : 'unread'}`;
                emailElement.innerHTML = `
                    <span><strong>${email.recipients.join(', ')}</strong></span>
                    <span>${email.subject}</span>
                    <span class="text-muted">${email.timestamp}</span>
                `;
                emailElement.addEventListener('click', () => load_email(email.id));
                document.querySelector('#emails-view').append(emailElement);
            });
        })
        .catch(error => console.error('Error:', error));
}

function load_email(email_id) {
    // Masquer toutes les vues actuelles
    hideAllViews();

    // Afficher la vue des détails de l'email
    document.querySelector('#emails-detail-view').style.display = 'block';

    // Récupérer les détails de l'email depuis le serveur
    fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
            // Afficher les détails de l'email
            document.querySelector('#emails-detail-view').innerHTML = `
                <ul class="list-group">
                    <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
                    <li class="list-group-item"><strong>To:</strong> ${email.recipients.join(', ')}</li>
                    <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
                    <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
                    <li class="list-group-item">${email.body}</li>
                </ul>
                <button id="archive-button" class="btn btn-outline-primary mt-3">${email.archived ? 'Unarchive' : 'Archive'}</button>
            `;

            // Ajouter un gestionnaire d'événements pour archiver l'email
            document.querySelector('#archive-button').addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: !email.archived
                    })
                })
                .then(() => {
                    // Recharger la boîte de réception après l'archivage
                    load_emails('inbox');
                });
            });
        })
        .catch(error => console.error('Error:', error));
}



// Gestion du button Compose
function showComposeView() {
    hideAllViews();
    document.querySelector('#compose-view').style.display = 'block';

    // Effacer les champs de composition
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}


// Envoyer les Emails
function sendEmail(event){
        event.preventDefault();
        const recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
        })
        .catch(error => console.error('Error:', error));
}



