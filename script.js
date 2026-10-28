
/* =========================================
   RUANG. — PERSONAL FINANCE TRACKER
   Penyimpanan lokal menggunakan localStorage
========================================= */

const STORAGE_KEY = "ruang-finance-transactions";
const BUDGET_KEY = "ruang-finance-budgets";
const GOAL_KEY = "ruang-finance-goals";

const demoTransactions = [
  { id: 1, date: "2026-10-22", description: "Belanja bulanan", category: "Kebutuhan", type: "pengeluaran", amount: 185000 },
  { id: 2, date: "2026-10-21", description: "Gaji", category: "Gaji", type: "pemasukan", amount: 2500000 },
  { id: 3, date: "2026-10-20", description: "Transportasi", category: "Transportasi", type: "pengeluaran", amount: 50000 },
  { id: 4, date: "2026-10-18", description: "Makan siang", category: "Makanan & Minuman", type: "pengeluaran", amount: 45000 },
  { id: 5, date: "2026-10-15", description: "Freelance", category: "Freelance", type: "pemasukan", amount: 1000000 }
];

let transactions = loadTransactions();
let budgets = loadStoredArray(BUDGET_KEY);
let goals = loadStoredArray(GOAL_KEY);
let currentFilter = "semua";
let balanceHidden = false;
let editingId = null;

/* =========================================
   PENYIMPANAN DATA
========================================= */

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return [...demoTransactions];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      throw new Error("Format transaksi tidak valid.");
    }

    return parsed.filter(item =>
      item &&
      Number.isFinite(Number(item.id)) &&
      typeof item.date === "string" &&
      typeof item.description === "string" &&
      typeof item.category === "string" &&
      ["pemasukan", "pengeluaran", "tabungan"].includes(item.type) &&
      Number.isFinite(Number(item.amount)) &&
      Number(item.amount) > 0
    );
  } catch (error) {
    console.error("Gagal membaca transaksi:", error);
    alert("Data transaksi tidak bisa dibaca. Data tersimpan tidak diubah.");
    return [];
  }
}

function loadStoredArray(key) {
  try {
    const saved = localStorage.getItem(key);

    if (saved === null) {
      return [];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca penyimpanan:", error);
    alert("Data budget atau tabungan tidak bisa dibaca.");
    return [];
  }
}

function saveArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Data gagal disimpan. Periksa ruang penyimpanan browser.");
    return false;
  }
}

function saveTransactions() {
  return saveArray(STORAGE_KEY, transactions);
}

/* =========================================
   FUNGSI BANTU
========================================= */

function formatMoney(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function getTodayDate() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCurrentMonth() {
  return getTodayDate().slice(0, 7);
}

function formatDate(date) {
  const parsed = new Date(date + "T12:00:00");

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function formatMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month || "")) {
    return month || "";
  }

  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, monthNumber - 1, 1));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function calculateTotals() {
  const income = transactions
    .filter(item => item.type === "pemasukan")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expense = transactions
    .filter(item => item.type === "pengeluaran")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    income,
    expense,
    balance: income - expense
  };
}

function getSortedTransactions() {
  return [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || Number(b.id) - Number(a.id)
  );
}

/* =========================================
   TAMPILAN TRANSAKSI
========================================= */

function transactionRow(item) {
  const isIncome = item.type === "pemasukan";
  const isSaving = item.type === "tabungan";

  const typeLabel = isSaving
    ? "Setoran tabungan"
    : isIncome
      ? "Pemasukan"
      : "Pengeluaran";

  const amountClass = isSaving
    ? ""
    : isIncome
      ? "amount-income"
      : "amount-expense";

  const sign = isSaving ? "" : isIncome ? "+" : "−";

  const description = isSaving
    ? `${item.description || "Setoran tabungan"}${item.goalName ? ` · ${item.goalName}` : ""}`
    : item.description;

  return `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>
        <div class="transaction-name">
          <span class="transaction-symbol">${isSaving ? "♧" : isIncome ? "↙" : "↗"}</span>
          <div>
            <strong>${escapeHTML(description)}</strong>
          </div>
        </div>
      </td>
      <td>${escapeHTML(item.category || "Lainnya")}</td>
      <td>
        <span class="type-badge ${isIncome ? "" : "expense"}">
          ${typeLabel}
        </span>
      </td>
      <td class="right ${amountClass}">
        ${sign} ${formatMoney(item.amount)}
      </td>
      <td>
        <div class="row-actions">
          ${isSaving ? "" : `<button type="button" data-edit="${item.id}">Edit</button>`}
          <button type="button" data-delete="${item.id}">Hapus</button>
        </div>
      </td>
    </tr>
  `;
}

function renderTransactions() {
  const sorted = getSortedTransactions();
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim().toLowerCase();

  const filtered = sorted.filter(item => {
    const matchesType =
      currentFilter === "semua" || item.type === currentFilter;

    const searchableText =
      `${item.description} ${item.category} ${item.goalName || ""}`.toLowerCase();

    return matchesType && searchableText.includes(query);
  });

  document.getElementById("transactionTable").innerHTML =
    sorted.slice(0, 5).map(transactionRow).join("");

  document.getElementById("allTransactions").innerHTML =
    filtered.map(transactionRow).join("");

  const emptyMessage = document.getElementById("emptyMessage");

  emptyMessage.classList.toggle("hidden", filtered.length > 0);

  if (transactions.length === 0) {
    emptyMessage.textContent =
      "Belum ada transaksi. Tambahkan transaksi pertamamu!";
  } else if (filtered.length === 0) {
    emptyMessage.textContent = "Transaksi tidak ditemukan.";
  }

  document.getElementById("recentTransactions").innerHTML =
    sorted.slice(0, 4).map(item => {
      const isIncome = item.type === "pemasukan";
      const isSaving = item.type === "tabungan";

      const description = isSaving
        ? item.goalName || "Setoran tabungan"
        : item.description;

      const label = isSaving ? "Tabungan" : item.category;

      return `
        <div class="recent-item">
          <span class="transaction-symbol">
            ${isSaving ? "♧" : isIncome ? "↙" : "↗"}
          </span>
          <div class="recent-detail">
            <strong>${escapeHTML(description)}</strong>
            <small>${escapeHTML(label)} · ${formatDate(item.date)}</small>
          </div>
          <span class="recent-amount ${
            isSaving ? "" : isIncome ? "amount-income" : "amount-expense"
          }">
            ${isSaving ? "" : isIncome ? "+" : "−"}${formatMoney(item.amount)}
          </span>
        </div>
      `;
    }).join("");
}

/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {
  const totals = calculateTotals();

  document.getElementById("balance").textContent =
    balanceHidden ? "••••••••" : formatMoney(totals.balance);

  document.getElementById("income").textContent =
    formatMoney(totals.income);

  document.getElementById("expense").textContent =
    formatMoney(totals.expense);

  document.getElementById("walletBalance").textContent =
    formatMoney(totals.balance);

  document.getElementById("reportIncome").textContent =
    formatMoney(totals.income);

  document.getElementById("reportExpense").textContent =
    formatMoney(totals.expense);

  document.getElementById("reportBalance").textContent =
    formatMoney(totals.balance);

  renderTransactions();
  renderBudgets();
  renderGoals();
}

/* =========================================
   NAVIGASI HALAMAN
========================================= */

function openPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll("[data-page], [data-open]").forEach(button => {
    const target = button.dataset.page || button.dataset.open;
    button.classList.toggle("active", target === pageId);
  });

  document.querySelector(".sidebar").classList.remove("open");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-page], [data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page || button.dataset.open);
  });
});

/* =========================================
   TAMBAH DAN EDIT TRANSAKSI
========================================= */

function openModal() {
  editingId = null;

  const form = document.getElementById("transactionForm");
  form.reset();

  document.getElementById("dateInput").value = getTodayDate();

  document.querySelector("#modal h2").textContent = "Tambah transaksi";

  form.querySelector('[type="submit"]').textContent =
    "Simpan transaksi";

  document.getElementById("modal").classList.remove("hidden");
}

function editTransaction(id) {
  const item = transactions.find(
    transaction => Number(transaction.id) === Number(id)
  );

  if (!item || item.type === "tabungan") {
    return;
  }

  editingId = item.id;

  document.getElementById("dateInput").value = item.date;
  document.getElementById("descriptionInput").value = item.description;
  document.getElementById("categoryInput").value = item.category;
  document.getElementById("typeInput").value = item.type;
  document.getElementById("amountInput").value = item.amount;

  document.querySelector("#modal h2").textContent = "Edit transaksi";

  document.querySelector(
    "#transactionForm [type='submit']"
  ).textContent = "Simpan perubahan";

  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("transactionForm").reset();
  editingId = null;
}

document.getElementById("addButton").addEventListener("click", openModal);
document.getElementById("addButton2").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

document.getElementById("modal").addEventListener("click", event => {
  if (event.target.id === "modal") {
    closeModal();
  }
});

document.getElementById("transactionForm").addEventListener("submit", event => {
  event.preventDefault();

  const date = document.getElementById("dateInput").value;
  const amount = Number(document.getElementById("amountInput").value);
  const description = document.getElementById("descriptionInput").value.trim();
  const category = document.getElementById("categoryInput").value;
  const type = document.getElementById("typeInput").value;

  if (
    !date ||
    date > getTodayDate() ||
    !description ||
    !category ||
    !["pemasukan", "pengeluaran"].includes(type) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    alert("Periksa kembali tanggal dan data transaksi.");
    return;
  }

  const item = {
    id: editingId ?? Date.now(),
    date,
    description,
    category,
    type,
    amount
  };

  const previous = transactions;

  if (editingId !== null) {
    transactions = transactions.map(old =>
      Number(old.id) === Number(editingId) ? item : old
    );
  } else {
    transactions = [...transactions, item];
  }

  if (!saveTransactions()) {
    transactions = previous;
    return;
  }

  renderDashboard();
  closeModal();
});

/* =========================================
   FILTER TRANSAKSI
========================================= */

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      filterButton.classList.toggle("active", filterButton === button);
    });

    renderTransactions();
  });
});


document.getElementById("searchInput").addEventListener("input", () => {
  renderTransactions();

  const activePage = document.querySelector(".page.active");

  if (activePage && activePage.id === "kategori") {
    renderCategorySearch();
  }
});

function renderCategorySearch() {
  const query = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  const categoryCards = document.querySelectorAll("#kategori .category-card");
  let visibleCount = 0;

  categoryCards.forEach(card => {
    const matches = card.textContent.toLowerCase().includes(query);

    card.style.display = matches ? "" : "none";

    if (matches) visibleCount++;
  });

  let emptyMessage = document.getElementById("categorySearchEmpty");

  if (!emptyMessage) {
    emptyMessage = document.createElement("p");
    emptyMessage.id = "categorySearchEmpty";
    emptyMessage.className = "empty-message hidden";

    document.querySelector("#kategori .category-grid")
      .insertAdjacentElement("afterend", emptyMessage);
  }

  emptyMessage.textContent = "Kategori tidak ditemukan.";
  emptyMessage.classList.toggle("hidden", visibleCount > 0);
}


/* =========================================
   AKSI EDIT DAN HAPUS
========================================= */

document.addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");

  if (editButton) {
    editTransaction(Number(editButton.dataset.edit));
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");

  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);

    const item = transactions.find(
      transaction => Number(transaction.id) === id
    );

    if (!item) return;

    if (!confirm("Yakin ingin menghapus transaksi ini?")) {
      return;
    }

    const previous = transactions;

    transactions = transactions.filter(
      transaction => Number(transaction.id) !== id
    );

    if (!saveTransactions()) {
      transactions = previous;
      return;
    }

    renderDashboard();
    return;
  }

  const deleteBudgetButton = event.target.closest("[data-delete-budget]");

  if (deleteBudgetButton) {
    const id = Number(deleteBudgetButton.dataset.deleteBudget);

    if (!confirm("Hapus budget ini? Riwayat transaksi tetap tersimpan.")) {
      return;
    }

    const previous = budgets;

    budgets = budgets.filter(item => Number(item.id) !== id);

    if (!saveArray(BUDGET_KEY, budgets)) {
      budgets = previous;
    }

    renderDashboard();
    return;
  }

  const deleteGoalButton = event.target.closest("[data-delete-goal]");

  if (deleteGoalButton) {
    const id = Number(deleteGoalButton.dataset.deleteGoal);

    const hasContributions = transactions.some(
      item => item.type === "tabungan" &&
        String(item.goalId) === String(id)
    );

    const warning = hasContributions
      ? "Target ini memiliki riwayat setoran. Menghapus target juga menghapus setoran terkait. Lanjutkan?"
      : "Hapus target tabungan ini?";

    if (!confirm(warning)) return;

    const previousGoals = goals;
    const previousTransactions = transactions;

    goals = goals.filter(goal => Number(goal.id) !== id);

    transactions = transactions.filter(
      item => !(item.type === "tabungan" && Number(item.goalId) === id)
    );

    const goalsSaved = saveArray(GOAL_KEY, goals);
    const transactionsSaved = saveTransactions();

    if (!goalsSaved || !transactionsSaved) {
      goals = previousGoals;
      transactions = previousTransactions;

      saveArray(GOAL_KEY, goals);
      saveTransactions();
    }

    renderDashboard();
    return;
  }

  const contributeButton = event.target.closest("[data-contribute]");

  if (contributeButton) {
    openContributionFor(Number(contributeButton.dataset.contribute));
  }
});

/* =========================================
   SEMBUNYIKAN SALDO
========================================= */

document.getElementById("toggleBalance").addEventListener("click", () => {
  balanceHidden = !balanceHidden;
  renderDashboard();
});

/* =========================================
   MENU MOBILE
========================================= */

document.getElementById("menuToggle").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

/* =========================================
   BUDGET BULANAN
========================================= */

function getMonthTransactions(month) {
  return transactions.filter(item =>
    item.date.slice(0, 7) === month &&
    item.type === "pengeluaran"
  );
}

function getBudgetSpent(budget) {
  return getMonthTransactions(budget.month)
    .filter(item => item.category === budget.category)
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

function renderBudgets() {
  const monthInput = document.getElementById("budgetMonthInput");
  const month = monthInput.value || getCurrentMonth();

  const monthBudgets = budgets.filter(item => item.month === month);

  const totalBudget = monthBudgets.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );

  const totalSpent = monthBudgets.reduce(
    (sum, item) => sum + getBudgetSpent(item), 0
  );

  document.getElementById("budgetTotal").textContent =
    formatMoney(totalBudget);

  document.getElementById("budgetSpent").textContent =
    formatMoney(totalSpent);

  document.getElementById("budgetRemaining").textContent =
    formatMoney(totalBudget - totalSpent);

  document.getElementById("budgetList").innerHTML =
    monthBudgets.map(item => {
      const spent = getBudgetSpent(item);
      const limit = Number(item.amount);
      const percent = limit > 0 ? spent / limit * 100 : 0;
      const remaining = limit - spent;
      const over = percent > 100;
      const near = percent >= 80 && !over;

      const fillClass = over ? "over" : near ? "warning" : "";

      const status = over
        ? "Budget terlampaui"
        : near
          ? "Hampir mencapai batas"
          : "Masih dalam batas";

      return `
        <article class="budget-card">
          <div class="budget-card-top">
            <div>
              <h3>${escapeHTML(item.category)}</h3>
              <p>${escapeHTML(formatMonth(item.month))}</p>
            </div>
            <button class="card-delete" data-delete-budget="${item.id}">
              Hapus
            </button>
          </div>

          <div class="budget-amounts">
            <div>
              <small>Terpakai</small>
              <strong>${formatMoney(spent)}</strong>
            </div>
            <div>
              <small>Batas budget</small>
              <strong>${formatMoney(limit)}</strong>
            </div>
          </div>

          <div class="progress-track">
            <div class="progress-fill ${fillClass}"
              style="width:${Math.min(percent, 100)}%">
            </div>
          </div>

          <div class="progress-caption">
            <span>${percent.toFixed(0)}% terpakai</span>
            <span>${escapeHTML(status)}</span>
          </div>

          <div class="budget-amounts">
            <div>
              <small>${remaining >= 0 ? "Sisa budget" : "Melebihi budget"}</small>
              <strong>${formatMoney(Math.abs(remaining))}</strong>
            </div>
          </div>
        </article>
      `;
    }).join("");

  document.getElementById("budgetEmpty").classList.toggle(
    "hidden",
    monthBudgets.length > 0
  );
}

document.getElementById("dateButton").addEventListener("click", () => {
  openPage("budget");
  document.getElementById("budgetMonthInput").focus();
});

document.getElementById("budgetMonthInput").value = getCurrentMonth();

document.getElementById("budgetMonthInput").addEventListener("change", () => {
  renderBudgets();
});

document.getElementById("budgetForm").addEventListener("submit", event => {
  event.preventDefault();

  const month = document.getElementById("budgetMonthInput").value;
  const category = document.getElementById("budgetCategoryInput").value;
  const amount = Number(document.getElementById("budgetAmountInput").value);

  if (
    !/^\d{4}-\d{2}$/.test(month) ||
    !category ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    alert("Isi bulan, kategori, dan batas budget dengan benar.");
    return;
  }

  const existing = budgets.find(
    item => item.month === month && item.category === category
  );

  const previous = budgets;

  if (existing) {
    budgets = budgets.map(item =>
      item.id === existing.id ? { ...item, amount } : item
    );
  } else {
    budgets = [...budgets, { id: Date.now(), month, category, amount }];
  }

  if (!saveArray(BUDGET_KEY, budgets)) {
    budgets = previous;
    return;
  }

  document.getElementById("budgetAmountInput").value = "";
  renderBudgets();
});

/* =========================================
   TARGET TABUNGAN
========================================= */

function getGoalSaved(goalId) {
  return transactions
    .filter(item =>
      item.type === "tabungan" &&
      String(item.goalId) === String(goalId)
    )
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

function renderGoals() {
  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.amount), 0
  );

  const totalSaved = goals.reduce(
    (sum, goal) => sum + getGoalSaved(goal.id), 0
  );

  document.getElementById("goalTotalTarget").textContent =
    formatMoney(totalTarget);

  document.getElementById("goalTotalSaved").textContent =
    formatMoney(totalSaved);

  const goalSelect = document.getElementById("contributionGoalInput");

  goalSelect.innerHTML = goals.length
    ? goals.map(goal =>
        `<option value="${goal.id}">${escapeHTML(goal.name)} — ${formatMoney(goal.amount)}</option>`
      ).join("")
    : '<option value="">Buat target terlebih dahulu</option>';

  goalSelect.disabled = goals.length === 0;

  document.getElementById("goalList").innerHTML =
    goals.map(goal => {
      const saved = getGoalSaved(goal.id);
      const target = Number(goal.amount);
      const percent = target > 0 ? saved / target * 100 : 0;
      const remaining = Math.max(0, target - saved);
      const complete = saved >= target;

      return `
        <article class="goal-card">
          <div class="goal-card-top">
            <div class="goal-heading">
              <div class="goal-icon">♧</div>
              <div>
                <h3>${escapeHTML(goal.name)}</h3>
                <p>Target ${formatMoney(target)}</p>
              </div>
            </div>
            <button class="card-delete" data-delete-goal="${goal.id}">
              Hapus
            </button>
          </div>

          <div class="goal-amounts">
            <div>
              <small>Total terkumpul</small>
              <strong>${formatMoney(saved)}</strong>
            </div>
            <div>
              <small>Target</small>
              <strong>${formatMoney(target)}</strong>
            </div>
          </div>

          <div class="progress-track">
            <div class="progress-fill ${complete ? "" : percent >= 80 ? "warning" : ""}"
              style="width:${Math.min(percent, 100)}%">
            </div>
          </div>

          <div class="progress-caption">
            <span>${percent.toFixed(0)}% tercapai</span>
            <span>${complete ? "Target tercapai!" : `Kurang ${formatMoney(remaining)}`}</span>
          </div>

          <div class="goal-actions">
            <button class="primary-button" data-contribute="${goal.id}">
              ＋ Catat setoran
            </button>
          </div>
        </article>
      `;
    }).join("");

  document.getElementById("goalEmpty").classList.toggle(
    "hidden",
    goals.length > 0
  );
}

function openContributionFor(goalId) {
  const select = document.getElementById("contributionGoalInput");

  select.value = String(goalId);

  document.getElementById("contributionDateInput").value = getTodayDate();

  document.getElementById("contributionAmountInput").focus();

  document.getElementById("contributionForm").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

document.getElementById("goalForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("goalNameInput").value.trim();
  const amount = Number(document.getElementById("goalAmountInput").value);

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    alert("Isi nama target dan nominal target dengan benar.");
    return;
  }

  const previous = goals;

  goals = [...goals, {
    id: Date.now(),
    name,
    amount
  }];

  if (!saveArray(GOAL_KEY, goals)) {
    goals = previous;
    return;
  }

  document.getElementById("goalForm").reset();
  renderGoals();
});

document.getElementById("contributionDateInput").value = getTodayDate();

document.getElementById("contributionForm").addEventListener("submit", event => {
  event.preventDefault();

  const goalId = Number(
    document.getElementById("contributionGoalInput").value
  );

  const goal = goals.find(item => Number(item.id) === goalId);

  const amount = Number(
    document.getElementById("contributionAmountInput").value
  );

  const date = document.getElementById("contributionDateInput").value;

  if (!goal) {
    alert("Buat target tabungan terlebih dahulu.");
    return;
  }

  if (!date || date > getTodayDate() || !Number.isFinite(amount) || amount <= 0) {
    alert("Periksa kembali tanggal dan nominal setoran.");
    return;
  }

  const item = {
    id: Date.now(),
    date,
    description: "Setoran tabungan",
    category: "Tabungan",
    type: "tabungan",
    amount,
    goalId: goal.id,
    goalName: goal.name
  };

  const previous = transactions;
  transactions = [...transactions, item];

  if (!saveTransactions()) {
    transactions = previous;
    return;
  }

  document.getElementById("contributionForm").reset();
  document.getElementById("contributionDateInput").value = getTodayDate();

  renderDashboard();

  alert(`Setoran ${formatMoney(amount)} untuk "${goal.name}" berhasil dicatat.`);
});

/* =========================================
   MULAI APLIKASI
========================================= */

renderDashboard();


function openCategoryDetail(categoryName) {
  const categoryPage = document.getElementById("kategori");
  const categoryGrid = categoryPage.querySelector(".category-grid");

  let detail = document.getElementById("categoryDetail");

  // Buat area detail kalau belum ada
  if (!detail) {
    detail = document.createElement("div");
    detail.id = "categoryDetail";
    categoryGrid.insertAdjacentElement("afterend", detail);
  }

  // Ambil transaksi yang sesuai kategori
  const transactions = JSON.parse(
    localStorage.getItem("ruang-finance-transactions") || "[]"
  )
    .filter(transaction =>
      transaction.category.toLowerCase() === categoryName.toLowerCase()
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const rupiah = amount =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);

  const formatDate = date =>
    new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  categoryGrid.style.display = "none";

  const emptyMessage = document.getElementById("categorySearchEmpty");
  if (emptyMessage) emptyMessage.style.display = "none";

  detail.style.display = "block";

  detail.innerHTML = `
    <button type="button" id="backToCategories" class="btn-secondary">
      Kembali ke Kategori
    </button>

    <div class="category-detail-heading">
      <p>DETAIL KATEGORI</p>
      <h2>${categoryName}</h2>
      <span>${transactions.length} transaksi</span>
    </div>

    <div class="category-transaction-list">
      ${
        transactions.length
          ? transactions.map(transaction => `
            <div class="category-transaction-item">
              <div class="category-transaction-info">
                <strong>${transaction.description}</strong>
                <span>${formatDate(transaction.date)}</span>
              </div>

              <div class="category-transaction-amount ${
                transaction.type === "pemasukan" ? "income" : "expense"
              }">
                <strong>
                  ${transaction.type === "pemasukan" ? "+" : "-"}
                  ${rupiah(transaction.amount)}
                </strong>
                <span>${
                  transaction.type === "pemasukan"
                    ? "Pemasukan"
                    : transaction.type === "tabungan"
                    ? "Tabungan"
                    : "Pengeluaran"
                }</span>
              </div>
            </div>
          `).join("")
          : `<p class="empty-message">
              Belum ada transaksi di kategori ${categoryName}.
             </p>`
      }
    </div>
  `;

  document.getElementById("backToCategories").addEventListener("click", () => {
    detail.style.display = "none";
    categoryGrid.style.display = "";

    if (typeof renderCategorySearch === "function") {
      renderCategorySearch();
    }
  });
}

// Klik kartu kategori untuk membuka detailnya
document.querySelector("#kategori .category-grid")
  .addEventListener("click", event => {
    const card = event.target.closest(".category-card");

    if (!card) return;

    const categoryName = card.querySelector("h3")?.textContent.trim();

    if (categoryName) {
      openCategoryDetail(categoryName);
    }
  });
