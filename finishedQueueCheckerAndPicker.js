let servedTickets = [];
let autoClickEnabled = true;
let isPaused = false;


// Function to safely query the DOM and parse integers
function queryInt(selector, regex = null) {
    try {
        const element = document.querySelector(selector);
        if (!element) return null;

        let text = element.textContent.trim();
        if (regex) {
            const match = text.match(regex);
            return match ? parseInt(match[1], 10) : null;
        }

        return parseInt(text, 10);
    } catch (error) {
        console.error(`Error querying selector ${selector}:`, error);
        return null;
    }
}

// Fetch the ticket count for "Менеджер бакалавра"
function fetchManagerTicketCount() {
    return queryInt('.detail-value div', /Менеджер бакалавра:\s*(\d+)/) || 0;
}

// Fetch the currently served ticket number
function fetchCurrentTicketNumber() {
    return queryInt('.detail-value.last-called-ticket');
}

// Click the "Next Ticket" button if enabled
function clickNextTicketButton() {
    if (!autoClickEnabled) return;

    try {
        const nextButton = document.querySelector('.call-next-button');
        if (nextButton) {
            nextButton.click();
            console.log('Next ticket button clicked.');
        } else {
            console.log('Next ticket button not found.');
        }
    } catch (error) {
        console.error('Error clicking next ticket button:', error);
    }
}

// Update the DOM with served tickets
function updateServedTicketsDisplay() {
    let servedTicketsContainer = document.getElementById('served-tickets-container');
    if (!servedTicketsContainer) {
        servedTicketsContainer = document.createElement('div');
        servedTicketsContainer.id = 'served-tickets-container';
        servedTicketsContainer.innerHTML = `
            <h2>Served Tickets</h2>
            <div id="served-tickets"></div>
        `;
        document.body.appendChild(servedTicketsContainer);
    }
    document.getElementById('served-tickets').textContent = servedTickets.join(', ');
}

// Update the status message in the DOM
function updateStatusMessage(status, ticketNumber = null) {
    let statusContainer = document.getElementById('status-container');
    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.id = 'status-container';
        statusContainer.style = `
            margin-top: 20px; padding: 10px 20px;
            font-size: 18px; border: 1px solid #ccc;
            border-radius: 5px; background-color: #f9f9f9;
        `;
        statusContainer.innerHTML = `<strong>Status:</strong> <span id="status-message"></span>`;
        document.body.appendChild(statusContainer);
    }

    const message = `${status}${ticketNumber !== null ? ` Currently serving ticket number: ${ticketNumber}` : ''}`;
    const statusMessageElement = document.getElementById('status-message');
    statusMessageElement.textContent = message;

    // Change background color based on status
    if (status.includes('Currently serving a client')) {
        statusContainer.style.backgroundColor = 'yellow'; // Set background to yellow when serving a client
        statusContainer.style.color = 'black';
    } else if (status.includes('No Clients in queue')) {
        statusContainer.style.backgroundColor = 'green'; // Set background to green when no clients are in the queue
        statusContainer.style.color = 'white';
    } else {
        statusContainer.style.backgroundColor = '#f9f9f9'; // Default color
    }
}


// Create the control button for stopping and resuming the auto-click
function createControlButton() {
    const controlButton = document.createElement('button');
    controlButton.id = 'control-button';
    controlButton.textContent = 'Done with Client, Next Client';
    controlButton.style = 'margin-top: 20px; padding: 10px 20px; font-size: 16px;';
    controlButton.addEventListener('click', () => {
        isPaused = false;
        autoClickEnabled = true;
        controlButton.disabled = true;
        const currentManagerCount = fetchManagerTicketCount();

        if (currentManagerCount === 0) {
            updateStatusMessage('No Clients in queue, currently searching for new clients in queue');
        } else {
            updateStatusMessage('Searching for new clients...');
        }

        console.log('Resuming automatic clicking for next client.');
    });
    document.body.appendChild(controlButton);
}


// Update the "Next Ticket" button text and color
function updateNextTicketButton() {
    const nextButton = document.querySelector('.call-next-button');
    if (nextButton) {
        nextButton.textContent = isPaused ? 'DO NOT PRESS' : 'СЛЕДУЮЩИЙ ТАЛОН';
        nextButton.style.backgroundColor = isPaused ? 'red' : '';
    }
}

// Handle initial ticket queue
function handleInitialQueue() {
    const currentManagerCount = fetchManagerTicketCount();
    const currentTicketNumber = fetchCurrentTicketNumber();

    if (currentManagerCount > 0) {
        console.log(`Initial queue detected with ${currentManagerCount} clients.`);
        updateStatusMessage('Currently serving a client. Press the green button when done.', currentTicketNumber + 1);
        servedTickets.push(currentTicketNumber);
        updateServedTicketsDisplay();
        isPaused = autoClickEnabled = false;
        updateNextTicketButton();
        document.getElementById('control-button').disabled = false;
    } else {
        updateStatusMessage('No clients in the queue.');
    }
}

// Continuously monitor changes in ticket count and currently served ticket number
function monitorTicketCount() {
    let previousManagerCount = fetchManagerTicketCount();
    let previousTicketNumber = fetchCurrentTicketNumber();

    setInterval(() => {
        if (isPaused) return;

        const currentManagerCount = fetchManagerTicketCount();
        const currentTicketNumber = fetchCurrentTicketNumber();

        // Check if the displayed ticket number matches the actual current ticket number
        const statusMessageElement = document.getElementById('status-message');
        const displayedTicketNumber = parseInt(statusMessageElement.textContent.match(/Currently serving ticket number: (\d+)/)?.[1], 10);

        // Ensure the status message is only updated when needed
        if (currentManagerCount === 0 && autoClickEnabled) {
            updateStatusMessage('No Clients in queue, currently searching for new clients in queue');
            return; // Stop further updates until the queue changes
        }

        if (currentTicketNumber !== displayedTicketNumber) {
            updateStatusMessage('Currently serving a client. Press the green button when done.', currentTicketNumber);
        }

        // Auto-click logic when the queue is not empty
        if (currentManagerCount > 0 && autoClickEnabled) {
            clickNextTicketButton();
            autoClickEnabled = false;
            isPaused = true;
            document.getElementById('control-button').disabled = false;
            updateStatusMessage('Currently serving a client. Press the green button when done.', currentTicketNumber + 1);
        }

        if (currentTicketNumber !== null && currentTicketNumber !== previousTicketNumber) {
            previousTicketNumber = currentTicketNumber;
            updateStatusMessage('Currently serving a client. Press the green button when done.', currentTicketNumber + 1);
            servedTickets.push(currentTicketNumber);
            updateServedTicketsDisplay();
            console.log(`Currently serving ticket number changed to ${currentTicketNumber}`);
        }

        if (currentManagerCount !== null && currentManagerCount !== previousManagerCount) {
            console.log(`Manager ticket count changed from ${previousManagerCount} to ${currentManagerCount}`);
            previousManagerCount = currentManagerCount;

            if (currentManagerCount === 0) {
                updateStatusMessage('No clients in the queue.');
            }
        }

        updateNextTicketButton();
    }, 500);
}


createControlButton();
handleInitialQueue();
monitorTicketCount();
