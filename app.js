import { createClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./config.js";

const projectGrid = document.querySelector("#project-grid");
const projectStatus = document.querySelector("#project-status");
const dialog = document.querySelector("#admin-dialog");
const imageViewer = document.querySelector("#image-viewer");
const imageViewerImage = imageViewer.querySelector("img");
const loginForm = document.querySelector("#login-form");
const manager = document.querySelector("#project-manager");
const projectForm = document.querySelector("#project-form");
const managedProjects = document.querySelector("#managed-projects");
const loginMessage = document.querySelector("#login-message");
const projectMessage = document.querySelector("#project-message");
const layoutToggle = document.querySelector("#layout-toggle");
let revealObserver;

const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey)
    : null;

const fields = {
  id: document.querySelector("#project-id"),
  title: document.querySelector("#project-name"),
  summary: document.querySelector("#project-summary"),
  stack: document.querySelector("#project-stack"),
  imageUrls: document.querySelector("#project-image"),
  imageFile: document.querySelector("#project-image-file"),
  github: document.querySelector("#project-github"),
  demo: document.querySelector("#project-demo"),
  featured: document.querySelector("#project-featured"),
};

function setMessage(element, message, isError = true) {
  element.textContent = message;
  element.classList.toggle("success-message", !isError && Boolean(message));
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function safeLink(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function registerReveals(root = document) {
  const elements = root.querySelectorAll("[data-reveal]:not([data-reveal-bound])");
  elements.forEach((element, index) => {
    element.dataset.revealBound = "true";
    element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);
    revealObserver?.observe(element);
  });
}

function trackPointer(element) {
  element.addEventListener("pointermove", (event) => {
    const bounds = element.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    element.style.setProperty("--pointer-x", `${x}px`);
    element.style.setProperty("--pointer-y", `${y}px`);
    if (element.classList.contains("project-card")) {
      element.style.setProperty("--rotate-x", `${((0.5 - y / bounds.height) * 4).toFixed(2)}deg`);
      element.style.setProperty("--rotate-y", `${((x / bounds.width - 0.5) * 4).toFixed(2)}deg`);
    }
  });
  element.addEventListener("pointerleave", () => {
    element.style.removeProperty("--rotate-x");
    element.style.removeProperty("--rotate-y");
  });
}

function setupMotion() {
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" },
    );
    registerReveals();
    document.documentElement.classList.add("motion-ready");
  } else {
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  const progress = document.querySelector(".scroll-progress span");
  let scheduled = false;
  const updateProgress = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
      scheduled = false;
    });
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".hero-art, .project-card").forEach(trackPointer);
  }

  const roleWord = document.querySelector(".role-word");
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && roleWord) {
    const roles = [
      "experiências digitais",
      "aplicações web e mobile",
      "soluções de ponta a ponta",
    ];
    let activeRole = 0;
    window.setInterval(() => {
      roleWord.classList.add("is-switching");
      window.setTimeout(() => {
        activeRole = (activeRole + 1) % roles.length;
        roleWord.textContent = roles[activeRole];
        roleWord.classList.remove("is-switching");
      }, 220);
    }, 3800);
  }
}

function setLayout(theme, persist = true) {
  const isSoft = theme === "soft";
  document.body.dataset.theme = isSoft ? "soft" : "modern";
  layoutToggle.setAttribute("aria-pressed", String(isSoft));
  layoutToggle.setAttribute(
    "aria-label",
    `Alternar layout. Atual: ${isSoft ? "soft" : "moderno"}`,
  );
  layoutToggle.title = `Alternar para o layout ${isSoft ? "moderno" : "soft"}`;
  layoutToggle.querySelector(".layout-toggle-icon").textContent = isSoft ? "☼" : "◐";
  document.querySelector('meta[name="theme-color"]').content = isSoft ? "#f5f4ef" : "#0b1020";
  const favicon = document.querySelector("#site-favicon");
  const nextFavicon = document.createElement("link");
  nextFavicon.id = "site-favicon";
  nextFavicon.rel = "icon";
  nextFavicon.type = "image/svg+xml";
  nextFavicon.sizes = "any";
  nextFavicon.href = isSoft ? "/favicon-soft.svg?v=2" : "/favicon-modern.svg?v=2";
  favicon.replaceWith(nextFavicon);

  if (persist) {
    try {
      window.localStorage.setItem("portfolio-layout", isSoft ? "soft" : "modern");
    } catch (error) {
      console.error("Não foi possível guardar a preferência de layout:", error);
    }
  }
}

try {
  const savedTheme = window.localStorage.getItem("portfolio-layout");
  if (savedTheme === "soft" || savedTheme === "modern") setLayout(savedTheme, false);
} catch (error) {
  console.error("Não foi possível recuperar a preferência de layout:", error);
}

layoutToggle.addEventListener("click", () => {
  setLayout(document.body.dataset.theme === "modern" ? "soft" : "modern");
  menuToggle.setAttribute("aria-expanded", "false");
  primaryNav.classList.remove("nav-open");
});

function createProjectCard(project) {
  const card = makeElement("article", `project-card${project.featured ? " project-featured" : ""}`);
  card.dataset.reveal = "";
  const image = makeElement("div", "project-image");
  image.setAttribute("role", "region");
  image.setAttribute("aria-label", `Imagens do projeto ${project.title}`);
  image.setAttribute("aria-roledescription", "carrossel");
  const savedImages = Array.isArray(project.image_urls) && project.image_urls.length
    ? project.image_urls
    : [project.image_url];
  const imageUrls = [...new Set(savedImages.map(safeLink).filter(Boolean))];

  if (imageUrls.length) {
    const slides = imageUrls.map((url, index) => {
      const img = document.createElement("img");
      img.className = `project-slide${index === 0 ? " is-active" : ""}`;
      img.src = url;
      img.alt = `Imagem ${index + 1} do projeto ${project.title}`;
      img.loading = index === 0 ? "eager" : "lazy";
      img.setAttribute("aria-hidden", String(index !== 0));
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", `Ampliar imagem ${index + 1} do projeto ${project.title}`);
      img.tabIndex = index === 0 ? 0 : -1;
      img.addEventListener("click", () => {
        if (img.classList.contains("is-active")) {
          imageViewerImage.src = img.src;
          imageViewerImage.alt = img.alt;
          imageViewer.showModal();
        }
      });
      img.addEventListener("keydown", (event) => {
        if (img.classList.contains("is-active") && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          imageViewerImage.src = img.src;
          imageViewerImage.alt = img.alt;
          imageViewer.showModal();
        }
      });
      image.append(img);
      return img;
    });

    if (slides.length > 1) {
      const controls = makeElement("div", "carousel-controls");
      const indicators = makeElement("div", "carousel-indicators");
      let activeIndex = 0;
      let timer;

      const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex;
          slide.classList.toggle("is-active", isActive);
          slide.setAttribute("aria-hidden", String(!isActive));
          slide.tabIndex = isActive ? 0 : -1;
          indicators.children[slideIndex].setAttribute("aria-pressed", String(isActive));
        });
      };
      const stopAutoplay = () => {
        window.clearInterval(timer);
        timer = undefined;
      };
      const startAutoplay = () => {
        if (!timer && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          timer = window.setInterval(() => showSlide(activeIndex + 1), 4500);
        }
      };

      const previous = makeElement("button", "carousel-arrow", "‹");
      previous.type = "button";
      previous.setAttribute("aria-label", "Imagem anterior");
      previous.addEventListener("click", () => showSlide(activeIndex - 1));
      controls.append(previous);

      for (let index = 0; index < slides.length; index += 1) {
        const indicator = makeElement("button", "carousel-indicator");
        indicator.type = "button";
        indicator.setAttribute("aria-label", `Mostrar imagem ${index + 1} de ${slides.length}`);
        indicator.setAttribute("aria-pressed", String(index === 0));
        indicator.addEventListener("click", () => showSlide(index));
        indicators.append(indicator);
      }
      controls.append(indicators);

      const next = makeElement("button", "carousel-arrow", "›");
      next.type = "button";
      next.setAttribute("aria-label", "Próxima imagem");
      next.addEventListener("click", () => showSlide(activeIndex + 1));
      controls.append(next);
      image.append(controls);
      image.addEventListener("pointerenter", stopAutoplay);
      image.addEventListener("pointerleave", startAutoplay);
      image.addEventListener("focusin", stopAutoplay);
      image.addEventListener("focusout", startAutoplay);
      startAutoplay();
    }
  } else {
    image.append(makeElement("span", "project-image-mark", "H."));
  }
  if (project.featured) image.append(makeElement("span", "featured-label", "DESTAQUE"));
  card.append(image);

  const content = makeElement("div", "project-content");
  content.append(makeElement("h3", "", project.title));
  content.append(makeElement("p", "project-summary", project.summary));
  const stack = makeElement("ul", "project-stack");
  for (const technology of project.stack || []) {
    stack.append(makeElement("li", "", technology));
  }
  content.append(stack);

  const links = makeElement("div", "project-links");
  const githubUrl = safeLink(project.github_url);
  const demoUrl = safeLink(project.demo_url);
  if (githubUrl) {
    const link = makeElement("a", "", "GitHub ↗");
    link.href = githubUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    links.append(link);
  }
  if (demoUrl) {
    const link = makeElement("a", "", "Ver projeto ↗");
    link.href = demoUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    links.append(link);
  }
  content.append(links);
  card.append(content);
  return card;
}

function createManagedProject(project) {
  const row = makeElement("article", "managed-project");
  const info = makeElement("div", "managed-project-info");
  info.append(makeElement("strong", "", project.title));
  info.append(makeElement("span", "", project.stack?.join(" · ") || "Sem tecnologias"));
  row.append(info);

  const actions = makeElement("div", "managed-project-actions");
  const edit = makeElement("button", "text-link", "Editar");
  edit.type = "button";
  edit.addEventListener("click", () => beginEdit(project));
  const remove = makeElement("button", "text-link delete-link", "Excluir");
  remove.type = "button";
  remove.addEventListener("click", () => deleteProject(project));
  actions.append(edit, remove);
  row.append(actions);
  return row;
}

function renderProjects(projects) {
  projectGrid.replaceChildren();
  managedProjects.replaceChildren();
  if (projects.length === 0) {
    const empty = makeElement("article", "project-placeholder");
    const art = makeElement("div", "placeholder-art");
    art.append(makeElement("span", "", "+"));
    empty.append(art, makeElement("p", "eyebrow", "EM BREVE"));
    empty.append(makeElement("h3", "", "Novos projetos estão a caminho."));
    empty.append(makeElement("p", "", "Volte em breve para conhecer os trabalhos que estou preparando."));
    projectGrid.append(empty);
  } else {
    for (const project of projects) projectGrid.append(createProjectCard(project));
  }
    registerReveals(projectGrid);
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      projectGrid.querySelectorAll(".project-card").forEach((card) => {
        if (!card.dataset.pointerBound) {
          card.dataset.pointerBound = "true";
          trackPointer(card);
        }
      });
    }
    for (const project of projects) managedProjects.append(createManagedProject(project));
}

async function loadProjects() {
  if (!supabase) {
    projectStatus.hidden = false;
    projectStatus.textContent =
      "A galeria será carregada quando a conexão com o Supabase estiver configurada.";
    return;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Não foi possível carregar os projetos:", error);
    projectStatus.hidden = false;
    projectStatus.textContent = "Não foi possível carregar os projetos. Tente novamente mais tarde.";
    return;
  }

  projectStatus.hidden = true;
  renderProjects(data);
}

function resetProjectForm() {
  projectForm.reset();
  fields.id.value = "";
  document.querySelector("#project-form-title").textContent = "Adicionar projeto";
  document.querySelector("#save-project").innerHTML = 'Salvar projeto <span>↗</span>';
  document.querySelector("#cancel-edit").hidden = true;
  setMessage(projectMessage, "");
}

function beginEdit(project) {
  fields.id.value = project.id;
  fields.title.value = project.title;
  fields.summary.value = project.summary;
  fields.stack.value = (project.stack || []).join(", ");
  const imageUrls = Array.isArray(project.image_urls) && project.image_urls.length
    ? project.image_urls
    : [project.image_url].filter(Boolean);
  fields.imageUrls.value = imageUrls.join("\n");
  fields.github.value = project.github_url || "";
  fields.demo.value = project.demo_url || "";
  fields.featured.checked = project.featured;
  fields.imageFile.value = "";
  document.querySelector("#project-form-title").textContent = "Editar projeto";
  document.querySelector("#save-project").innerHTML = 'Salvar alterações <span>↗</span>';
  document.querySelector("#cancel-edit").hidden = false;
  projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateOptionalUrl(value, label) {
  if (!value) return true;
  if (safeLink(value)) return true;
  setMessage(projectMessage, `Informe uma URL válida para ${label} (http ou https).`);
  return false;
}

async function uploadImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("portfolio-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio-images").getPublicUrl(path);
  return data.publicUrl;
}

function getImageUrls() {
  return fields.imageUrls.value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
}

async function saveProject(event) {
  event.preventDefault();
  setMessage(projectMessage, "");
  const imageUrls = getImageUrls();
  if (!imageUrls.every((url) => safeLink(url))) {
    setMessage(projectMessage, "Informe uma URL válida para cada imagem (http ou https), uma por linha.");
    return;
  }
  if (!validateOptionalUrl(fields.github.value, "o GitHub")) return;
  if (!validateOptionalUrl(fields.demo.value, "o projeto publicado")) return;
  if (!supabase) {
    setMessage(projectMessage, "Configure a conexão com o Supabase antes de salvar.");
    return;
  }

  const submitButton = document.querySelector("#save-project");
  submitButton.disabled = true;
  try {
    const uploadedImages = await Promise.all(
      Array.from(fields.imageFile.files, (file) => uploadImage(file)),
    );
    const projectImages = [...new Set([...imageUrls, ...uploadedImages])];
    const project = {
      title: fields.title.value.trim(),
      summary: fields.summary.value.trim(),
      stack: fields.stack.value.split(",").map((item) => item.trim()).filter(Boolean),
      image_urls: projectImages,
      image_url: projectImages[0] || null,
      github_url: fields.github.value.trim() || null,
      demo_url: fields.demo.value.trim() || null,
      featured: fields.featured.checked,
    };

    let result;
    if (fields.id.value) {
      result = await supabase.from("projects").update(project).eq("id", fields.id.value);
    } else {
      result = await supabase.from("projects").insert(project);
    }
    if (result.error) throw result.error;
    resetProjectForm();
    setMessage(projectMessage, "Projeto salvo e publicado com sucesso.", false);
    await loadProjects();
    await loadManagerProjects();
  } catch (error) {
    console.error("Não foi possível salvar o projeto:", error);
    setMessage(projectMessage, `Não foi possível salvar o projeto: ${error.message}`);
  } finally {
    submitButton.disabled = false;
  }
}

async function loadManagerProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Não foi possível carregar a lista de projetos:", error);
    setMessage(projectMessage, "Não foi possível carregar sua lista de projetos.");
    return;
  }
  managedProjects.replaceChildren(...data.map(createManagedProject));
}

async function deleteProject(project) {
  if (!window.confirm(`Excluir o projeto “${project.title}”?`)) return;
  const { error } = await supabase.from("projects").delete().eq("id", project.id);
  if (error) {
    console.error("Não foi possível excluir o projeto:", error);
    setMessage(projectMessage, `Não foi possível excluir o projeto: ${error.message}`);
    return;
  }
  if (fields.id.value === project.id) resetProjectForm();
  setMessage(projectMessage, "Projeto excluído.", false);
  await loadProjects();
  await loadManagerProjects();
}

async function updateAuthState(session) {
  if (!session) {
    loginForm.hidden = false;
    manager.hidden = true;
    resetProjectForm();
    return;
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) {
    console.error("Não foi possível verificar o acesso administrativo:", error);
    await supabase.auth.signOut();
    loginForm.hidden = false;
    manager.hidden = true;
    setMessage(loginMessage, "Não foi possível verificar seu acesso. Confira a configuração do Supabase.");
    return;
  }
  if (!admin) {
    await supabase.auth.signOut();
    loginForm.hidden = false;
    manager.hidden = true;
    setMessage(loginMessage, "Esta conta não tem permissão para gerenciar o portfólio.");
    return;
  }

  loginForm.hidden = true;
  manager.hidden = false;
  await loadManagerProjects();
}

document.querySelector("#open-admin").addEventListener("click", async () => {
  if (!supabase) {
    setMessage(loginMessage, "A conexão com o Supabase ainda não foi configurada.");
  }
  if (!dialog.open) dialog.showModal();
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Não foi possível verificar a sessão:", error);
      setMessage(loginMessage, "Não foi possível verificar sua sessão. Tente novamente.");
    } else {
      await updateAuthState(data.session);
    }
  }
});

document.querySelector("#close-admin").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
document.querySelector("#close-image-viewer").addEventListener("click", () => imageViewer.close());
imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) imageViewer.close();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "");
  if (!supabase) {
    setMessage(loginMessage, "Configure a conexão com o Supabase antes de entrar.");
    return;
  }
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  const formData = new FormData(loginForm);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  button.disabled = false;
  if (error) {
    setMessage(loginMessage, "Não foi possível entrar. Confira o e-mail e a senha.");
    return;
  }
  await updateAuthState(data.session);
});

document.querySelector("#sign-out").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Não foi possível encerrar a sessão:", error);
    setMessage(projectMessage, "Não foi possível sair. Tente novamente.");
    return;
  }
  await updateAuthState(null);
});

projectForm.addEventListener("submit", saveProject);
document.querySelector("#cancel-edit").addEventListener("click", resetProjectForm);

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");
menuToggle.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  primaryNav.classList.toggle("nav-open", !expanded);
});
primaryNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("nav-open");
  });
});

setupMotion();
loadProjects().catch((error) => {
  console.error("Não foi possível carregar os projetos:", error);
  projectStatus.hidden = false;
  projectStatus.textContent = "Não foi possível carregar os projetos. Tente novamente mais tarde.";
});
