// Client-side Script Module - script.js

// Log user in
document.addEventListener('DOMContentLoaded', () => {
    const authIn = async (event) => {
        event.preventDefault(); 

        const username = document.querySelector('input[name="username"]').value;
        const password = document.querySelector('input[name="password"]').value;

        const authBox = document.querySelector('.authBox')
        const errorDiv = document.getElementById('errorDiv') || document.createElement('div');
        errorDiv.id = 'errorDiv';
        
        try {
            const response = await fetch('/auth/in', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log('User logged in:', data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/'; 
            } else {

                const { message } = await response.json();
                errorDiv.innerHTML = message;
                authBox.insertBefore(errorDiv, authBox.firstChild);
            }

        } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'An error occurred. Please try again.';
            errorDiv.innerHTML = errorMessage; 
            authBox.insertBefore(errorDiv, authBox.firstChild);
        }
    };
    
    const logInForm = document.getElementById('login'); 
    if (logInForm) {
        logInForm.addEventListener('submit', authIn);
    }
});

// Sign up new user
document.addEventListener('DOMContentLoaded', () => {
    const signUpUser = async (event) => {
        event.preventDefault();
        const form = document.getElementById('signupForm');
        const formData = new FormData(form);

        const authBox = document.querySelector('.authBox');
        const errorDiv = document.getElementById('errorDiv') || document.createElement('div');
        errorDiv.id = 'errorDiv';

        try {
            const response = await fetch('/auth/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(formData)),
                credentials: 'same-origin',
            });

            if (response.ok) {
                const data = await response.json();
                console.log('User logged in:', data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/';

            } else {
                const { message } = await response.json();
                errorDiv.innerHTML = message;
                authBox.insertBefore(errorDiv, authBox.firstChild);
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = 'An error occurred. Please try again.';
            errorDiv.innerHTML = errorMessage;
            authBox.insertBefore(errorDiv, authBox.firstChild);
        }
    };

    const signupForm = document.getElementById('signupForm');
    if (signupForm) { 
        signupForm.addEventListener('submit', signUpUser);
    }
});

// Log user out
document.addEventListener('DOMContentLoaded', () => {
    const authOut = async (event) => {
        console.log('User logged out');

        try {
            const response = await fetch('/auth/out', {
                method: 'POST',
                credentials: 'same-origin',
            });
    
            if (response.ok) {
                console.log('User logged out')
                localStorage.setItem('user', null);
                window.location.href = '/';
            } else {
                const { message } = await response.json();
                alert(message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };
    
    const logOutLink = document.getElementById('logOut');
    if (logOutLink) {
        logOutLink.addEventListener('click', authOut);
    }
});

// Get user data if logged in
function getUserData() {

    const userData = localStorage.getItem('user');

    if (userData) {
        const user = JSON.parse(userData);
        console.log('User:', user);
        return user;
    } else {
        console.log('User data not found in localStorage.');
        return null;
    }
}

// Connect users via profile link
document.addEventListener('DOMContentLoaded', () => {
    let errorRendered = false;

    const threadConnect = async (event) => {
        event.preventDefault();

        // Get connecting users 
        const userData = getUserData();
        if (!userData) {
            console.error('Failed to fetch user data. Please try again.');
            return;
        }

        const connector = userData;
        const connectee = document.getElementById('userTag').innerText;

        if (connector === connectee) {
            const urlInput = document.createElement('input');
            urlInput.value = window.location.href;
            document.body.appendChild(urlInput);
            urlInput.select();
            document.execCommand('copy');
            document.body.removeChild(urlInput);
            alert('URL copied to clipboard!');
            return;
        }

        let party = [connector, connectee];

        console.log('Connecting users:', party);   

        try {
            const response = await fetch('/thread/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ party }),
                credentials: 'same-origin',
            });

            if (response.ok) {                
                console.log('Success:', response);

                // handle next function after connecting
                // like rendering the new specific thread
                window.location.href = '/inbox';

            } else {
                const { message } = await response.json();
                console.error('Error:', message);
                renderError(message);
            }
        } catch (error) {
            console.error('Error:', error);
            renderError('An error occurred. Please try again.');
        }
    };

    const connectLink = document.getElementById('connectLink');
    if (connectLink) { 
        connectLink.addEventListener('click', threadConnect);
    }

    const renderError = (errorMessage) => {
      if (!errorRendered) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'errorDiv';
        errorDiv.textContent = errorMessage;
        const profileDiv = document.querySelector('.profile');
        profileDiv.insertBefore(errorDiv, profileDiv.firstChild);
        errorRendered = true; 
      }
    };
});

// Send message via API
document.addEventListener('DOMContentLoaded', () => {
    const sendMessage = async (event) => {
        event.preventDefault();

        const userData = await getUserData();
        if (!userData) {
            alert('Failed to fetch user data. Please try again.');
            return;
        }

        const author = userData;

        const threadId = document.getElementById('threadId').value;
        const content = document.getElementById('messageContent').value;

        console.log('Sending message:', author, content, threadId);

        if (!content.trim()) {
            alert('Please enter a message.');
            return;
        }

        const data = {
            author,
            content,
            threadId
        };

        try {
            const response = await fetch(`/thread/${threadId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                credentials: 'same-origin',
            });

            if (response.ok) {                
                console.log('Message sent successfully:', response);

                // Reload the page to get the updated thread

                window.location.reload();


            } else {
                const { message } = await response.json();
                alert(message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message. Please try again.');
        }
    };

    const messageControl = document.getElementById('messageControl');
    if (messageControl) { 
        messageControl.addEventListener('submit', sendMessage);
    }
});

// Add current user's messages to "owned" class, pinning them to right side of thread
document.addEventListener('DOMContentLoaded', async () => {
    const messages = document.querySelectorAll('.threadMessage');

    try {
        const author = await getUserData();
        if (!author) {
            console.error('Failed to fetch user data. Please try again.');
            return;
        }
        console.log('Filtering by author:', author, messages);
        messages.forEach(message => {
            const messageAuthor = message.querySelector('.author').textContent.trim();
            if (messageAuthor === author) {
                message.classList.add('owned');
            }
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
        console.log('Auto focus to', lastMessage)
        lastMessage.scrollIntoView({ behavior: 'smooth' });
    }
});


// Update user status
document.addEventListener('DOMContentLoaded', () => {
    const updateStatus = async (event) => {
        event.preventDefault();

        const username = await getUserData();
        if (!username) {
            console.error('Failed to fetch user data. Please try again.');
            return;
        }

        const status = document.querySelector('input[name="status"]').value;

        try {
        
          const response = await fetch('/status', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, status }),
          });
        
          if (response.ok) {
            console.log('Status updated successfully:', status);

            // Navigate to user profile or another page
            window.location.href = `/${username}`;
          } else {
              const { message } = await response.json();
              alert(message);
          }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message. Please try again.');
        }
    };

    const statusForm = document.getElementById('statusForm');
    if (statusForm) { 
        statusForm.addEventListener('submit', updateStatus);
    }
});

// Update user bio
document.addEventListener('DOMContentLoaded', () => {
    const updateBio = async (event) => {
        event.preventDefault();

        const username = await getUserData();
        if (!username) {
            console.error('Failed to fetch user data. Please try again.');
            return;
        }

        const bio = document.querySelector('input[name="bio"]').value;

        try {
        
          const response = await fetch('/bio', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, bio }),
          });
        
          if (response.ok) {
            console.log('Bio updated successfully:', bio);

            // Navigate to user profile or another page
            window.location.href = `/${username}`;
          } else {
              const { message } = await response.json();
              alert(message);
          }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message. Please try again.');
        }
    };

    const bioForm = document.getElementById('bioForm');
    if (bioForm) { 
        bioForm.addEventListener('submit', updateBio);
    }
});

// Update user bio
document.addEventListener('DOMContentLoaded', () => {
    const updateLink = async (event) => {
        event.preventDefault();

        const username = await getUserData();
        if (!username) {
            console.error('Failed to fetch user data. Please try again.');
            return;
        }

        const link = document.querySelector('input[name="link"]').value;

        try {
        
          const response = await fetch('/link', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, link }),
          });
        
          if (response.ok) {
            console.log('Link updated successfully:', link);

            // Navigate to user profile or another page
            window.location.href = `/${username}`;
          } else {
              const { message } = await response.json();
              alert(message);
          }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('An error occurred while sending the message. Please try again.');
        }
    };

    const linkForm = document.getElementById('linkForm');
    if (linkForm) { 
        linkForm.addEventListener('submit', updateLink);
    }
});