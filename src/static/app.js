document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Fetch activities and render activity cards with a participants section
  async function loadActivities() {
    const resp = await fetch('/activities');
    const container = document.getElementById('activities');
    if (!resp.ok) {
      container.textContent = 'Failed to load activities.';
      return;
    }
    const activities = await resp.json();
    container.innerHTML = '';

    for (const [name, info] of Object.entries(activities)) {
      const card = document.createElement('article');
      card.className = 'card';


      const participantsHtml = (info.participants || []).map(p =>
        `<li data-email="${escapeHtml(p)}"><span class="avatar">${initials(p)}</span><span class="email">${escapeHtml(p)}</span><button class="delete-participant" title="Remove participant" aria-label="Remove participant">🗑️</button></li>`
      ).join('');

      card.innerHTML = `
        <header class="card-header">
          <h2 class="activity-title">${escapeHtml(name)}</h2>
          <div class="meta">
            <span class="schedule">${escapeHtml(info.schedule || '')}</span>
            <span class="capacity">Max: ${escapeHtml(String(info.max_participants || ''))}</span>
          </div>
        </header>

        <p class="description">${escapeHtml(info.description || '')}</p>

        <section class="participants-section">
          <h3>Participants (${(info.participants || []).length})</h3>
          <ul class="participants-list">
            ${participantsHtml || '<li class="info">No participants yet</li>'}
          </ul>
        </section>
      `;

      // Add event listeners for delete buttons
      setTimeout(() => {
        card.querySelectorAll('.delete-participant').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const li = btn.closest('li');
            const email = li.getAttribute('data-email');
            if (!email) return;
            btn.disabled = true;
            btn.textContent = '...';
            try {
              const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              if (resp.ok) {
                li.remove();
              } else {
                const result = await resp.json();
                alert(result.detail || 'Failed to remove participant');
                btn.disabled = false;
                btn.textContent = '🗑️';
              }
            } catch (err) {
              alert('Network error');
              btn.disabled = false;
              btn.textContent = '🗑️';
            }
          });
        });
      }, 0);
      container.appendChild(card);
    }
  }

  function initials(email) {
    if (!email) return '?';
    const name = email.split('@')[0].replace(/[._]/g, ' ').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] ? parts[0][0] : '?').toUpperCase();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();


      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so new participant appears
        if (typeof loadActivities === 'function') {
          loadActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
