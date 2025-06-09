(() => {
  "use strict";

  // ===== КОНФИГУРАЦИЯ =====
  const CONFIG = {
    // ID вашего резюме на hh.ru
    // Чтобы найти ID: 
    // 1. Откройте ваше резюме на hh.ru
    // 2. В URL будет число, например: https://hh.ru/resume/1234567890abcdef
    // 3. Скопируйте это число сюда
    RESUME_ID: "ВАШ_ID_РЕЗЮМЕ",

    // Задержка между действиями (в миллисекундах)
    DELAY: 1500,

    // Шаблоны сопроводительных писем
    // Вы можете добавить свои шаблоны, просто скопировав и изменив существующие
    COVER_LETTERS: {
      // Шаблон по умолчанию
      default: `Добрый день! 

Меня заинтересовала предложенная Вами вакансия {#vacancyName}. Ознакомившись с перечнем требований к кандидатам, пришел к выводу, что мой опыт работы позволяют мне претендовать на данную должность. 

Обладаю высоким уровнем фронтенд-разработки, свободно говорю по-английски. В работе ответствен, пунктуален и коммуникабелен.

Буду с нетерпением ждать ответа и возможности обсудить условия работы и взаимные ожидания на собеседовании. Спасибо, что уделили время. 

Контактные данные прилагаю.`,

      // Дополнительные шаблоны
      template1: `Добрый день!

Меня заинтересовала вакансия {#vacancyName}. Готов обсудить детали сотрудничества.

С уважением,`,

      template2: `Здравствуйте!

Спасибо за интересную вакансию {#vacancyName}. Буду рад обсудить возможность сотрудничества.

С уважением,`,

      // Добавьте свои шаблоны здесь
      // template3: `Ваш шаблон`,
      // template4: `Ваш шаблон`,
      // template5: `Ваш шаблон`,
    }
  };

  // ===== СЕЛЕКТОРЫ =====
  const SELECTORS = {
    naviItems: ".supernova-navi-item.supernova-navi-item_lvl-2",
    blacklist: "[data-qa=vacancy__blacklist-show-add]",
    addBlacklist: "[data-qa=vacancy__blacklist-menu-add-vacancy]",
    pagerNext: '[data-qa="pager-next"]',
    modalOverlay: '[data-qa="modal-overlay"]',
    alertBox: '[data-qa="magritte-alert"]',
    countryConfirmBtn: ".bloko-modal-footer .bloko-button_kind-success",
    chatikCloseBtn: '[data-qa="chatik-close-chatik"]',
    vacancyCards: '[data-qa="vacancy-serp__vacancy"]',
    vacancyCard: '[data-qa="vacancy-response-link-top"]',
    vacancyTitle: "[data-qa='serp-item__title']",
    addCoverLetter: '[data-qa="vacancy-response-letter-toggle-text"]',
    coverLetterInput: "#cover-letter textarea",
    respondBtn: '[data-qa="vacancy-serp__vacancy_response"]',
    sendBtn: '[data-qa="vacancy-response-letter-submit"]',
    vacancyTitlePopup: '[data-qa="title-description"]',
    resumeDropdown: '[data-qa="resume-title"]',
    addCoverLetterPopup: '[data-qa="add-cover-letter"]',
    coverLetterInputPopup: '[data-qa="vacancy-response-popup-form-letter-input"]',
    respondBtnPopup: '[data-qa="vacancy-response-submit-popup"]'
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let isRunning = false;

  function getRunningState() {
    return isRunning;
  }

  function setRunningState(state) {
    isRunning = state;
  }

  const VACANCY_URL = "https://hh.ru/vacancy";
  const VACANCY_LIST_URLS = [
    "https://hh.ru/vacancies",
    "https://hh.ru/search/vacancy"
  ];

  function setCoverLetter(letterType, vacancyName) {
    const input = document.querySelector(SELECTORS.coverLetterInput) || 
                 document.querySelector(SELECTORS.coverLetterInputPopup);
    
    if (input) {
      function setNativeValue(element, value = "") {
        if ([window.HTMLInputElement, window.HTMLSelectElement, window.HTMLTextAreaElement]
            .includes(element?.__proto__?.constructor)) {
          Object.getOwnPropertyDescriptor(element.__proto__, "value").set.call(element, value);
          const event = new Event("input", { bubbles: true });
          element.dispatchEvent(event);
        }
      }

      setNativeValue(input, CONFIG.COVER_LETTERS[letterType].replace("{#vacancyName}", vacancyName));
    }
  }

  async function handleAlert() {
    const alert = document.querySelector(SELECTORS.alertBox);
    const buttons = alert?.nextElementSibling?.querySelectorAll("button");
    buttons?.[1]?.click();
    await sleep(CONFIG.DELAY);
  }

  async function respondToVacancy(vacancyName) {
    document.querySelector(SELECTORS.addCoverLetter).click();
    await sleep(CONFIG.DELAY);
    
    const sendButton = document.querySelector(SELECTORS.sendBtn);
    setCoverLetter("default", vacancyName);
    sendButton.click();
    await sleep(CONFIG.DELAY);
    
    document.querySelector(SELECTORS.chatikCloseBtn)?.click();
  }

  async function respondToVacancyPopup(vacancyName) {
    const respondButton = document.querySelector(SELECTORS.respondBtnPopup);
    
    await (async function() {
      const title = document.querySelector(SELECTORS.vacancyTitlePopup);
      const resumeDropdown = document.querySelector(SELECTORS.resumeDropdown);
      const addCoverLetter = document.querySelector(SELECTORS.addCoverLetterPopup);
      
      resumeDropdown.click();
      await sleep(CONFIG.DELAY);
      
      const resumeOption = document.querySelector(`[data-qa="magritte-select-option-${CONFIG.RESUME_ID}"]`);
      resumeOption?.click();
      addCoverLetter?.click() || title.click();
    })();
    
    await sleep(CONFIG.DELAY);
    setCoverLetter("default", vacancyName);
    respondButton.click();
    await sleep(CONFIG.DELAY);
  }

  async function processVacancies() {
    const submitButton = document.querySelector('[data-action="submit-responses"]');
    
    if (getRunningState()) {
      setRunningState(false);
      submitButton.textContent = "Отправить отклики";
      console.log("⏹️ Отправка откликов остановлена");
      return;
    }

    setRunningState(true);
    submitButton.textContent = "Остановить отправку";
    console.log("▶️ Начата отправка откликов");

    try {
      await (async function() {
        const currentUrl = window.location.href;
        const isSingleVacancy = currentUrl.includes(VACANCY_URL);
        const isVacancyList = VACANCY_LIST_URLS.some(url => currentUrl.includes(url));

        if (isSingleVacancy) {
          await (async function() {
            const vacancy = document.querySelector(SELECTORS.singleVacancy);
            if (vacancy) {
              vacancy.click();
              await respondToVacancy();
            }
          })();
        } else if (isVacancyList) {
          await (async function() {
            const vacancies = document.querySelectorAll(SELECTORS.vacancyCards);
            if (vacancies.length) {
              for (const vacancy of vacancies) {
                if (!getRunningState()) break;

                vacancy.scrollIntoView({ behavior: "smooth", block: "center" });
                vacancy.style.boxShadow = "0 0 8px #0059b3";

                const title = vacancy.querySelector(SELECTORS.vacancyTitle)?.innerText;
                const respondButton = vacancy.querySelector(SELECTORS.respondBtn);

                if (["Respond", "Откликнуться"].includes(respondButton?.innerText)) {
                  respondButton.click();
                  await sleep(CONFIG.DELAY);
                  
                  document.querySelector(SELECTORS.countryConfirmBtn)?.click();
                  await handleAlert();
                  
                  if (document.querySelector(SELECTORS.modalOverlay)) {
                    await respondToVacancyPopup(title);
                  } else {
                    await respondToVacancy(title);
                  }
                }

                vacancy.style.boxShadow = "";
              }
            }
          })();
        }
      })();
    } catch (error) {
      console.error("Ошибка при отправке откликов:", error);
    } finally {
      setRunningState(false);
      submitButton.textContent = "Отправить отклики";
      console.log("✅ Отправка откликов завершена");
    }
  }

  function findHelpElement(element, tag = "div", text = "Помощь") {
    return Array.from(element.querySelectorAll(tag))
      .find(el => el.textContent.trim() === text && el.children.length === 0);
  }

  // Инициализация
  (async function() {
    // Добавление кнопки отправки откликов
    await (async function() {
      await sleep(CONFIG.DELAY);
      const navItems = document.querySelectorAll(SELECTORS.naviItems);
      const submitButton = navItems[4].cloneNode(true);
      const helpElement = findHelpElement(submitButton);
      
      helpElement.setAttribute("data-action", "submit-responses");
      helpElement.textContent = "Отправить отклики";
      
      navItems[4].insertAdjacentElement("afterend", submitButton);
      submitButton.querySelector('[data-action="submit-responses"]')
        .addEventListener("click", processVacancies);
    })();

    // Добавление кнопки поддержки проекта
    await (async function() {
      const navItems = document.querySelectorAll(SELECTORS.naviItems);
      const supportButton = navItems[4].cloneNode(true);
      
      findHelpElement(supportButton).textContent = "Поддержать проект";
      supportButton.removeAttribute("href");
      supportButton.style.cursor = "pointer";
      
      supportButton.addEventListener("click", () => {
        window.open("https://boosty.to/ia-stepanov/donate", "_blank");
      });
      
      navItems[5].insertAdjacentElement("afterend", supportButton);
    })();
  })();
})();