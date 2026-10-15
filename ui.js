(function () {
  const currencyFormatter = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return entities[character];
    });
  }

  function formatCurrency(amount) {
    return currencyFormatter.format(amount);
  }

  function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function renderSubscriptions(subscriptions) {
    const list = document.getElementById("subscription-list");
    document.getElementById("subscription-count").textContent = `${subscriptions.length}개`;

    if (subscriptions.length === 0) {
      list.innerHTML = '<div class="empty-state"><strong>아직 등록된 구독이 없어요</strong><span>오른쪽 폼에서 첫 구독을 추가해 보세요.</span></div>';
      return;
    }

    const today = getLocalDateString();
    const orderedSubscriptions = subscriptions.slice().sort(function (a, b) {
      return window.getRemainingDays(today, a.nextPaymentDate) -
        window.getRemainingDays(today, b.nextPaymentDate);
    });

    list.innerHTML = orderedSubscriptions.map(function (subscription) {
      const remainingDays = window.getRemainingDays(today, subscription.nextPaymentDate);
      let dueLabel;
      let dueClass = "";

      if (remainingDays < 0) {
        dueLabel = `${Math.abs(remainingDays)}일 지남`;
        dueClass = " due-past";
      } else if (remainingDays === 0) {
        dueLabel = "오늘 결제";
        dueClass = " due-today";
      } else {
        dueLabel = `D-${remainingDays}`;
      }

      const monthlyAmount = window.convertToMonthlyAmount(subscription);
      return `
        <article class="subscription-item">
          <div class="subscription-main">
            <div class="subscription-title-row">
              <span class="subscription-name">${escapeHtml(subscription.name)}</span>
              <span class="category-tag">${escapeHtml(subscription.category)}</span>
            </div>
            <div class="subscription-meta">
              <span>${escapeHtml(subscription.nextPaymentDate)}</span>
              <span class="due-label${dueClass}">${escapeHtml(dueLabel)}</span>
            </div>
          </div>
          <div>
            <div class="subscription-amount">${formatCurrency(monthlyAmount)}<span class="amount-unit">/월</span></div>
            <div class="subscription-cycle">${subscription.cycle === "yearly" ? "연간 결제" : "월간 결제"}</div>
            <div class="subscription-actions">
              <button class="text-button" type="button" data-action="edit" data-id="${escapeHtml(subscription.id)}">수정</button>
              <button class="text-button text-button-danger" type="button" data-action="delete" data-id="${escapeHtml(subscription.id)}">삭제</button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function renderCategoryBreakdown(categoryTotals, monthlyTotal) {
    const container = document.getElementById("category-breakdown");
    const categories = Object.entries(categoryTotals)
      .sort(function (a, b) { return b[1] - a[1]; });

    if (categories.length === 0) {
      container.innerHTML = '<p class="category-empty">구독을 추가하면 카테고리별 지출 비중을 보여드려요.</p>';
      return;
    }

    container.innerHTML = categories.map(function (entry) {
      const category = entry[0];
      const amount = entry[1];
      const percentage = monthlyTotal > 0 ? amount / monthlyTotal * 100 : 0;
      return `
        <div class="category-row">
          <div class="category-label-row">
            <span class="category-name">${escapeHtml(category)} · ${formatCurrency(amount)}</span>
            <span class="category-share">${percentage.toFixed(1)}%</span>
          </div>
          <div class="progress-track" role="img" aria-label="${escapeHtml(category)} ${percentage.toFixed(1)}%">
            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
        </div>`;
    }).join("");
  }

  function renderSummary(subscriptions) {
    const monthlyTotal = window.calculateTotalMonthlyAmount(subscriptions);
    const annualTotal = window.calculateTotalAnnualAmount(subscriptions);
    const upcomingPayments = window.getUpcomingPayments(subscriptions, 7);
    const upcomingChargeTotal = upcomingPayments.reduce(function (total, subscription) {
      return total + subscription.amount;
    }, 0);

    document.getElementById("monthly-total").textContent = formatCurrency(monthlyTotal);
    document.getElementById("annual-total").textContent = formatCurrency(annualTotal);
    document.getElementById("upcoming-count").textContent = `${upcomingPayments.length}건`;
    document.getElementById("upcoming-total").textContent =
      `예정 금액 ${formatCurrency(upcomingChargeTotal)}`;

    renderCategoryBreakdown(window.groupSubscriptionsByCategory(subscriptions), monthlyTotal);
  }

  window.renderSubscriptionApp = function (subscriptions) {
    renderSummary(subscriptions);
    renderSubscriptions(subscriptions);
  };

  window.formatSubscriptionCurrency = formatCurrency;
}());
