(function () {
  const storageKey = "sub-tracker.subscriptions";
  const form = document.getElementById("subscription-form");
  const message = document.getElementById("app-message");
  const cancelEditButton = document.getElementById("cancel-edit");
  const submitButton = document.getElementById("submit-button");
  const formHeading = document.getElementById("form-heading");
  let subscriptions = loadSubscriptions();

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  function clearMessage() {
    message.textContent = "";
    message.hidden = true;
  }

  function loadSubscriptions() {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (storedValue === null) {
        return [];
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        throw new Error("저장된 구독 데이터가 배열 형식이 아닙니다.");
      }
      return parsedValue;
    } catch (error) {
      showMessage(`저장된 데이터를 불러오지 못했습니다. 브라우저 저장 공간을 확인해 주세요. (${error.message})`);
      return [];
    }
  }

  function saveSubscriptions() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(subscriptions));
      clearMessage();
      return true;
    } catch (error) {
      showMessage(`데이터를 브라우저에 저장하지 못했습니다. 저장 공간을 확인해 주세요. (${error.message})`);
      return false;
    }
  }

  function render() {
    window.renderSubscriptionApp(subscriptions);
  }

  function resetForm() {
    form.reset();
    form.elements.namedItem("id").value = "";
    formHeading.textContent = "새 구독 추가";
    submitButton.textContent = "구독 추가";
    cancelEditButton.hidden = true;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `sub-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function handleSubmit(event) {
    event.preventDefault();
    clearMessage();

    const formData = new FormData(form);
    const name = String(formData.get("name")).trim();
    const amount = Number(formData.get("amount"));
    const cycle = String(formData.get("cycle"));
    const nextPaymentDate = String(formData.get("nextPaymentDate"));
    const category = String(formData.get("category")).trim();
    const id = String(formData.get("id") || "");

    if (!name || !category || !Number.isFinite(amount) || amount <= 0 ||
        (cycle !== "monthly" && cycle !== "yearly") || !nextPaymentDate) {
      showMessage("이름, 금액, 결제 주기, 결제일, 카테고리를 올바르게 입력해 주세요.");
      return;
    }

    const subscription = { id: id || makeId(), name, amount, cycle, nextPaymentDate, category };
    if (id) {
      const index = subscriptions.findIndex(function (item) { return item.id === id; });
      if (index === -1) {
        showMessage("수정할 구독을 찾지 못했습니다. 목록을 새로 확인해 주세요.");
        resetForm();
        return;
      }
      subscriptions[index] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    saveSubscriptions();
    resetForm();
    render();
  }

  function startEditing(id) {
    const subscription = subscriptions.find(function (item) { return item.id === id; });
    if (!subscription) {
      showMessage("수정할 구독을 찾지 못했습니다.");
      return;
    }

    form.elements.namedItem("id").value = subscription.id;
    form.elements.namedItem("name").value = subscription.name;
    form.elements.namedItem("amount").value = subscription.amount;
    form.elements.namedItem("cycle").value = subscription.cycle;
    form.elements.namedItem("nextPaymentDate").value = subscription.nextPaymentDate;
    form.elements.namedItem("category").value = subscription.category;
    formHeading.textContent = "구독 수정";
    submitButton.textContent = "변경 저장";
    cancelEditButton.hidden = false;
    form.elements.namedItem("name").focus();
  }

  function deleteSubscription(id) {
    const subscription = subscriptions.find(function (item) { return item.id === id; });
    if (!subscription) {
      showMessage("삭제할 구독을 찾지 못했습니다.");
      return;
    }
    if (!window.confirm(`'${subscription.name}' 구독을 삭제할까요?`)) {
      return;
    }

    subscriptions = subscriptions.filter(function (item) { return item.id !== id; });
    if (form.elements.namedItem("id").value === id) {
      resetForm();
    }
    saveSubscriptions();
    render();
  }

  form.addEventListener("submit", handleSubmit);
  cancelEditButton.addEventListener("click", resetForm);
  document.getElementById("subscription-list").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    if (button.dataset.action === "edit") {
      startEditing(button.dataset.id);
    } else if (button.dataset.action === "delete") {
      deleteSubscription(button.dataset.id);
    }
  });

  render();
}());
