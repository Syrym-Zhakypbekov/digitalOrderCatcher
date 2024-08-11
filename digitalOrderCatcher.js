// Array to store served ticket numbers
let servedTickets = [];
let autoClickEnabled = true;
let isPaused = false; // New variable to control the pause and resume state

// Function to fetch the ticket count related to "Менеджер бакалавра"
function fetchManagerTicketCount() {
    try {
        const ticketCountElement = document.querySelector('.detail-value div');
        
        if (ticketCountElement) {
            const textContent = ticketCountElement.textContent.trim();

            if (textContent.includes('ОЧЕРЕДЬ ПУСТАЯ')) {
                return 0;
            }

            const match = textContent.match(/Менеджер бакалавра:\s*(\d+)/);
            if (match) {
                const currentCount = parseInt(match[1], 10);
                return currentCount;
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching ticket count:', error);
        return null;
    }
}

// Function to fetch the currently served ticket number
function fetchCurrentTicketNumber() {
    try {
        const currentTicketElement = document.querySelector('.detail-value.last-called-ticket');
        
        if (currentTicketElement) {
            const currentTicketNumber = parseInt(currentTicketElement.textContent.trim(), 10);
            return currentTicketNumber;
        }
        return null;
    } catch (error) {
        console.error('Error fetching current ticket number:', error);
        return null;
    }
}

// Function to click the "Next Ticket" button
function clickNextTicketButton() {
    try {
        if (autoClickEnabled) {
            const nextButton = document.querySelector('.call-next-button');
            if (nextButton) {
                nextButton.click();
                console.log('Next ticket button clicked.');
            } else {
                console.log('Next ticket button not found.');
            }
        }
    } catch (error) {
        console.error('Error clicking next ticket button:', error);
    }
}

// Function to update the DOM with served tickets
function updateServedTicketsDisplay() {
    let servedTicketsContainer = document.getElementById('served-tickets-container');

    if (!servedTicketsContainer) {
        // Create the container if it doesn't exist
        servedTicketsContainer = document.createElement('div');
        servedTicketsContainer.id = 'served-tickets-container';
        servedTicketsContainer.innerHTML = `
            <h2>Served Tickets</h2>
            <div id="served-tickets">${servedTickets.join(', ')}</div>
        `;
        document.body.appendChild(servedTicketsContainer);
    } else {
        // Update the content if the container already exists
        const servedTicketsDiv = servedTicketsContainer.querySelector('#served-tickets');
        servedTicketsDiv.textContent = servedTickets.join(', ');
    }
}

// Function to create the control button for stopping and resuming the auto-click
function createControlButton() {
    const controlButton = document.createElement('button');
    controlButton.id = 'control-button';
    controlButton.textContent = 'Done with Client, Next Client';
    controlButton.style.marginTop = '20px';
    controlButton.style.padding = '10px 20px';
    controlButton.style.fontSize = '16px';

    controlButton.addEventListener('click', () => {
        isPaused = false; // Reset pause status
        autoClickEnabled = true;  // Enable automatic clicking again
        controlButton.disabled = true;  // Disable the button until the next auto-click cycle
        console.log('Resuming automatic clicking for next client.');
    });

    document.body.appendChild(controlButton);
}

// Function to continuously check for changes in the ticket count and currently served ticket number
function monitorTicketCount() {
    let previousManagerCount = fetchManagerTicketCount();
    let previousTicketNumber = fetchCurrentTicketNumber();

    setInterval(() => {
        if (isPaused) return;  // Skip the loop if the process is paused

        try {
            const currentManagerCount = fetchManagerTicketCount();
            const currentTicketNumber = fetchCurrentTicketNumber();

            // Check if the manager's ticket count has changed
            if (currentManagerCount !== null && currentManagerCount !== previousManagerCount) {
                console.log(`Manager ticket count changed from ${previousManagerCount} to ${currentManagerCount}`);
                previousManagerCount = currentManagerCount;

                if (currentManagerCount > 0 && autoClickEnabled) {
                    clickNextTicketButton();
                    autoClickEnabled = false;  // Disable auto-click until the control button is pressed
                    isPaused = true;  // Pause the process until the user clicks the control button
                    document.getElementById('control-button').disabled = false;  // Enable the control button
                }
            }

            // Check if the currently served ticket number has changed
            if (currentTicketNumber !== null && currentTicketNumber !== previousTicketNumber) {
                console.log(`Currently serving ticket number changed to ${currentTicketNumber}`);

                // Add the new ticket to the served tickets array
                servedTickets.push(currentTicketNumber);

                previousTicketNumber = currentTicketNumber;

                // Update the DOM to display the served tickets
                updateServedTicketsDisplay();
            }

        } catch (error) {
            console.error('Error monitoring ticket count:', error);
        }
    }, 1000); // Check every second (1000ms)
}

// Create the control button when the page loads
createControlButton();

// Start monitoring
monitorTicketCount();
