document.addEventListener('DOMContentLoaded', function () {
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    //submit form
    document.querySelector('#compose-form').addEventListener('submit', send_email);
    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {
    // Show compose view and hide other views
    hide_all_views();
    document.querySelector('#compose-view').style.display = 'block';
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function hide_all_views() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-detail-view').style.display = 'none';
}

function view_email(id) {
    console.log(`Fetching email id: ${id}`);
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            console.log('Email data:', email);
            // Show the email detail view
            hide_all_views();
            document.querySelector('#emails-detail-view').style.display = 'block';
            // Clear previous email details
            const emailDetailView = document.querySelector('#emails-detail-view');
            emailDetailView.innerHTML = '';
            // Set email details
            const emailDetails = `
                <h3>${email.subject}</h3>
                <p>From: ${email.sender}</p>
                <p>To: ${email.recipients}</p>
                <p>${email.timestamp}</p>
                <hr>
                <p>${email.body}</p>
            `;
            emailDetailView.innerHTML = emailDetails;
            // Mark as read if not already read
            if (!email.read) {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ read: true })
                }).catch(error => {
                    console.error('Error setting email as read:', error);
                    alert('Failed to mark email as read');
                });
            }
            // Create the Archive/Unarchive button
            const btn_arch = document.createElement('button');
            btn_arch.innerHTML = email.archived ? "Unarchive" : "Archive";
            btn_arch.className = email.archived ? "btn btn-success" : "btn btn-danger";
            btn_arch.addEventListener('click', function () {
                fetch(`/emails/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ archived: !email.archived })
                })
                    .then(() => load_mailbox('archive'))
                    .catch(error => {
                        console.error('Error archiving/unarchiving email:', error);
                        alert('Failed to archive/unarchive email');
                    });
            });
            emailDetailView.append(btn_arch);
            // Create the Reply button
            const btn_reply = document.createElement('button');
            btn_reply.innerHTML = 'Reply';
            btn_reply.className = 'btn btn-primary';
            btn_reply.addEventListener('click', function () {
                compose_email();
                pre_fill_composition_fields(email);
            });
            emailDetailView.append(btn_reply);
        })
        .catch(error => {
            console.error('Error fetching email:', error);
            alert('Failed to fetch email details');
        });
}

function pre_fill_composition_fields(email) {
    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    if (!subject.startsWith("Re: ")) {
        subject = "Re: " + subject;
    }
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n`;
    document.querySelector('#compose-view').scrollTop = 0;
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    // Clear previous emails
    document.querySelector('#emails-view').innerHTML += '';
    // Get the emails for that mailbox and user
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(singleEmail => {
                const newEmail = document.createElement('div');
                newEmail.className = "list-group-item";
                newEmail.innerHTML = `
                <h6>Sender ${singleEmail.sender}</h6>
                <h5>Subject ${singleEmail.subject}</h5>
                <p>${singleEmail.timestamp}</p>
                `;
                console.log(`Email read status: ${singleEmail.read}`);
                // Change background color
                newEmail.classList.add(singleEmail.read ? 'read' : 'unread');
                // Add click event to view email
                newEmail.addEventListener('click', function () {
                    view_email(singleEmail.id);
                });
                document.querySelector('#emails-view').append(newEmail);
            })
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Échec du chargement des emails.');
        });
}

function send_email(event) {
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
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi de l\'email');
            }
            return response.json();
        })
        .then(result => {
            console.log(result);
            load_mailbox('sent');
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Échec de l\'envoi de l\'email.');
        });
}