# Spaces 2.0 — handoff

> Этот документ находится в корне репозитория `apps/spaces-2-0`.

> Дата: 2026-07-24  
> Проект: `/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0`  
> Назначение: практическая передача текущего прототипа Spaces следующему
> разработчику или новому Codex-треду.

## 1. Что это за проект

`apps/spaces-2-0` — изолированная лаборатория интерфейса Planner 5D Spaces.
Это не production-интеграция onboarding flow: здесь тестируются структура
левого меню, страницы Spaces/Home, внутренние коллекции, файловые представления,
режимы UI и данные пользователей.

Главная цель текущего этапа — получить реалистичный интерактивный прототип с:

- несколькими пользователями (Demo, Evelina, Vanessa и Natalia);
- данными Spaces, коллекций, файлов и папок;
- профилями интерфейса, переключаемыми через FAB внизу справа;
- корректной навигацией между Home, Space, коллекциями, Tabs и папками;
- локальным и отдельным Vercel preview для Evelynа.

## 2. Важное: что подтверждено, а что нужно проверить

Этот документ собран из истории реализации и требований к проекту. Не следует
додумывать точные имена исходных JS/CSS-файлов, команды или Vercel-настройки,
если их нет в текущем checkout.

Перед следующими изменениями обязательно выполнить:

```bash
cd "/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0"
git status --short
git diff --name-status
git log --oneline -12
find . -maxdepth 2 -name package.json -o -name vercel.json -o -name ".env*"
cat package.json
```

Это позволит восстановить точный список изменённых файлов и доступных scripts.

## 3. Текущее состояние

### Сделано или реализовано ранее

- Обновлён верхний Header Spaces: tooltips, иконки, hover-состояния, Create,
  Invite, Upgrade, уведомления, поисковая строка и профили визуальных вариантов.
- Реализован левый rail со Spaces, Pinned, Explore, раскрывающимися разделами,
  pin/unpin, counters, hover-иконками и drag-and-drop для pinned-порядка.
- Есть несколько UI-профилей: Sidebar/Explore, варианты Space Header, Content,
  Collections grid/type, Create buttons, Left rail density, Header и Inside.
- Реализованы Collections и Files/list view, а также Tabs view.
- Реализованы внутренние страницы коллекций, включая вариант Version 4 с
  папками и Projects.
- Добавлен пользовательский набор данных Evelina из
  `public/evelinas_data/`; демо-набор должен остаться доступным.
- Добавлен полный экспорт Vanessa из `public/vanessas_data/`: два Space,
  файлы всех коллекций, project/document folders и preview по hash.
- Добавлен профиль Natalia из `public/natalias_data/`: `projects.csv`
  используется для Floor Plans, а `screenshots.csv` распределяется между
  Renders, 360° Panorama и 360° Walkthrough по полю `type`.
- Настроена навигация Home → Space → Collection/Folder и частично browser Back.
- Добавлены внешние формулы URL для preview планов, рендеров, moodboards,
  360 panorama и 360 walkthrough.
- Создавались Vercel preview-деплои; один из известных preview URL:
  `https://spaces-2-0-evelina-preview-20260722-dwntpde0r.vercel.app`.

### Последняя незавершённая работа

- Требовалось переверстать Home screen по референсу
  `/Users/oleg/Desktop/Home 2.png` и использовать изображения, положенные в
  `public/`. Работа была остановлена до завершения.
- Последние правки касались Tabs list view, подсветки selected-состояний,
  48px цветных quick-action кружков и исправления отображения отладочной
  layout-разметки.

### Не начато / требует отдельной проверки

- Реальная серверная авторизация и production API. В прототипе это не следует
  считать готовой интеграцией.
- Реальная загрузка файлов, сохранение папок на сервере, доступы и совместное
  редактирование.
- Полный regression-pass всех профилей и обеих пользовательских баз.
- Production deployment: не выполнять без отдельного подтверждения.

## 4. Обязательные продуктовые решения

### 4.1. Базовые настройки профилей

При чистом входе должны использоваться следующие значения:

| Группа | Значение по умолчанию |
| --- | --- |
| Sidebar | Explore |
| Space header | Left |
| Content | Search |
| Collections grid | Default |
| Collections type | Collections |
| Create Buttons | On |
| Left rail density | 36px |
| Header: Create | Hide |
| Header: Navigation | Centered |
| Inside page | Version 4 |

Если эти настройки сохраняются в браузере, нужно предусмотреть способ
сбросить их для проверки. Не менять значения по умолчанию молча.

### 4.2. Профили интерфейса

Настройки открываются FAB-кнопкой внизу справа. Popover имеет вкладки:

- **General** — Sidebar, Space header, Page, Content, Collections grid,
  Collections type, Create Buttons, Left rail density.
- **Users** — выбор данных пользователя: Demo, Evelina, Vanessa и Natalia.
- **Header** — показ/скрытие Create в глобальном header и позиция навигации
  (Side/Centered).
- **Inside** — выбор внутренней страницы; актуальный вариант — Version 4.

Требования к popover:

- фиксированный размер: ширина **248px**, высота около **560px**;
- внутри — скролл, но ширина не должна «прыгать» при появлении scrollbar;
- профиль не закрывается при выборе значения;
- закрывается только по крестику или повторному клику FAB;
- все настройки должны быть локально сохранены и применяться без перезагрузки.

### 4.3. Коллекции и Tabs

Есть два режима:

1. **Collections** — стартовая страница Space показывает карточки коллекций.
   Клик по карточке открывает внутреннюю страницу выбранной коллекции.
2. **Tabs** — внутренняя страница как отдельный route не является основным
   флоу: коллекции показываются в табах в Space, а контент текущего tab
   отображается ниже.

Порядок коллекций должен быть единым в Collections, Tabs и левом rail:

1. Floor Plans
2. Renders
3. AI Studio
4. Moodboards
5. 360° Panorama
6. 360° Walkthrough
7. Documents

**Design Generator** не показывать среди Collections.

### 4.4. Create buttons

Включённое состояние отображает цветные quick actions в Space header.
Create добавлена первым элементом. Цветные круглые иконки должны быть **48×48px**.

У Version 4 / внутренних страниц есть:

- зелёная кнопка **Project**;
- нейтральная кнопка **Folder**;
- gap между ними — **12px**;
- текст Folder — token `text-beta`.

### 4.5. Внутренняя страница Version 4

Version 4 — текущая целевая внутреняя страница:

- breadcrumbs: название Space → название текущей Collection;
- toolbar: поиск, сортировка, действия Project / Folder;
- блок **Folders** показывается только если для текущей collection есть
  папки верхнего уровня;
- затем блок с маленьким заголовком, совпадающим с названием коллекции
  (например, **Renders**, не универсальный «Projects»);
- переключатель grid/list находится в строке заголовка файлов;
- внутри — файлы текущей collection.

Отступы:

- title → toolbar: **32px**;
- toolbar → заголовок Folders: **32px**;
- Folders heading → folder card: **24px**;
- folder card → название коллекции: **32px**;
- название коллекции → файловая сетка: **24px**.

Folder card:

- ширина 300px;
- `margin-top: 24px`;
- `padding: 16px 20px`;
- border `neutral-border-gamma`;
- radius 20px;
- высота не зафиксирована.

### 4.6. Preview URL-правила

Не хардкодить одинаковый путь preview для всех типов файлов.

| Тип | URL |
| --- | --- |
| Обычный project / floor plan | `https://storage.planner5d.com/thumbs.600/<hash>.webp` |
| Render | `https://storage.planner5d.com/s/<hash>_<number>` |
| Moodboard | `https://storage.planner5d.com/moodboards_thumbs.600/<hash>.webp` |
| 360° Panorama | `https://storage.planner5d.com/s/<hash>_<number>` |
| 360° Walkthrough | `https://storage.planner5d.com/s/<hash>_<number>` |
| Space | `https://storage.planner5d.com/space/<hash>` |

Для всех строк screenshot suffix берётся из поля `number` конкретной строки
CSV. Значения `_1`, `_2`, `_3` не являются кодами типов коллекции. Query
parameter `?v=<value>` используется как cache-buster и для отображения
существующего файла не обязателен.

Для карточек использовать endpoint без расширения: он отдаёт уменьшенный JPEG
preview. Вариант с `.webp` может возвращать существенно более крупный исходник
и не должен загружаться в grid/list preview.

Примеры hash, подтверждённые в задаче:

- `503a03d2b30e986280f92e54c440560b` для `thumbs.600`;
- `84f9154660fa46d81ae344d0526ebb3b` для render;
- `1c8947bbbb18ac37dcef313a89ea8642` для moodboard;
- `ffd86934ee56fb3c999e39c23bee8025_1` — подтверждённый render preview.

Если preview не существует, использовать правильную внутреннюю
placeholder-иконку коллекции. Не рендерить broken image и не показывать
placeholder одновременно с реальным preview.

## 5. Данные Evelynа

Источник: `public/evelinas_data/`.

Ожидаемые экспортные файлы включают (наличие подтвердить через `find`):

- Spaces / projects;
- screenshots CSV;
- folders CSV;
- вероятно moodboards и другие предметные файлы.

### Привязка данных

- Скриншоты с типом **Regular** относятся к **Renders**.
- Остальные screenshot types должны быть распределены в 360 Panorama или
  360 Walkthrough в соответствии с экспортом.
- `folders.csv` задаёт принадлежность папки к collection; в частности,
  `projects` соответствует **Floor Plans**.
- Показывать collections даже при нулевом количестве файлов.
- Дата последнего обновления должна отображаться и в Collections cards,
  и в list view, когда она есть в данных.

### Семантика папок

- `pid = 0` — папка верхнего уровня.
- `pid = <id>` — папка вложена в папку с указанным `id`.
- `deleted = 0` — активная папка.
- `deleted = 1` — soft-deleted: не показывать в обычном UI.

На текущем этапе показывать только верхний уровень папок. Если папка содержит
вложенные папки, не строить третий/четвёртый уровень меню, пока не будет
утверждён интерфейс. Файлы удалённых папок могут быть перенесены в корень
(`folder = 0`) — это историческая особенность источника.

## 5.1. Данные Vanessa

Источник: `public/vanessas_data/`.

Профиль Vanessa загружается тем же browser adapter, что и Evelina, но с
отдельной конфигурацией имён CSV. Нормализованный экспорт содержит:

- 2 Space: `My Space` (`29071888`) и активный `Vanessa's Space` (`12053332`);
- 229 активных файлов: 93 Floor Plans, 27 Renders, 1 Panorama,
  72 Walkthrough, 23 Moodboards, 12 AI Studio и 1 Document;
- 31 активную папку: 16 project folders и 15 document folders.

CSV `renders and 360 pano and walkthough.csv` является joined export и
содержит повторяющиеся заголовки. CSV parser сохраняет первое поле без
суффикса, а последующие одноимённые поля как `<name>_2`, чтобы не терять
данные.

В девяти screenshot rows остался исторический `space_id=744512`, которого нет
в `spaces.csv`. Эти записи не удаляются и не создают искусственный Space:
adapter находит связанный floor plan по screenshot hash / project `from` hash
и восстанавливает актуальный `space_id=12053332`.

AI Studio preview могут отсутствовать в публичном storage. В этом случае UI
обязан показать стандартный fallback, сохраняя исходный hash в модели.

## 5.2. Данные Natalia

Источник: `public/natalias_data/`.

Профиль Natalia использует отдельную конфигурацию общего CSV adapter:

- `projects.csv` соответствует **Floor Plans**;
- `screenshots.csv` распределяется по `type`: `regular` → **Renders**,
  `panoramic` → **360° Panorama**, `walkthrough360` →
  **360° Walkthrough**;
- `folders.csv` с `type=projects` относится к Floor Plans, а
  `type=snapshots` — к Renders;
- `spaces_documents.csv` и `spaces_documents_folders.csv` относятся к
  Documents.

Текущий экспорт содержит один активный Space `Mi Space` (`5998468`), 227
активных файлов, относящихся к этому Space: 87 Floor Plans, 60 Renders, 39
Walkthrough, 25 Moodboards, 15 AI Studio и 1 Document. В `spaces.csv` одна
строка Space повторяется для нескольких attributes, поэтому adapter
дедуплицирует Spaces по `id`.

Строки документов и document folders, которые ссылаются на отсутствующие или
soft-deleted Spaces, не переносятся в активный Space искусственно и не
показываются в UI. Для текущего активного Space сохраняются 11 папок: 2 project
folders, 1 snapshots folder и 8 document folders.

## 6. Навигационный контракт

### Основные маршруты

Точные Next route-файлы проверить в текущем checkout, но UI должен поддерживать:

- **Home** — отдельная страница;
- **Space root** — главная выбранного Space;
- **Collection / folder** — вложенная страница выбранного Space;
- **Tabs** — тот же Space с выбранной collection-tab.

Логотип Planner 5D должен открывать **Home**.

### Поведение левого меню

- На Space root в режиме **Collections** подсвечивается выбранный Space.
- На collection внутри выбранного Space:
  - выбранный Space остаётся подсвеченным;
  - выбранная collection также подсвечивается в раскрытом дереве.
- В режиме **Tabs**:
  - выбранный Space остаётся подсвеченным;
  - активный tab и соответствующий пункт в левом rail совпадают.
- При клике на другой Space, пока пользователь находится внутри Collection
  или Tabs, нужно открыть **root нового Space**, а не такую же collection
  нового Space.
- В режиме Tabs клик на Space из rail должен открывать Floor Plans как
  начальный tab.
- Dashboard не должен быть отдельной строкой в дереве Spaces: выделенный
  Space уже является его корнем.
- Если у collection есть верхнеуровневые папки, вместо file counter справа
  показывается chevron; по раскрытию видны эти папки.
- Если папок нет, отображать count только при `count > 0`; badge с `0`
  не показывать.
- Длинные названия в rail обязаны обрезаться с ellipsis.
- URL chevron для rail должен быть
  `/spaces-static/assets/images/sidebar/chevron-down.svg`, не
  `/assets/images/sidebar/chevron-down.svg`.

### History и scroll

- Browser Back/Forward должен работать в Demo, Evelina, Vanessa и Natalia.
- При переходе Space → collection/folder новая страница начинается с
  `scrollY = 0`.
- При возврате Back восстанавливается сохранённая прокрутка предыдущей
  страницы.
- При navigation нельзя оставлять stale header-shadow/border, возникший от
  скролла предыдущей страницы. После route change пересчитать состояние
  header для нового `scrollY`.

## 7. UI-детали, которые легко сломать

- Не использовать `!important` как способ исправить layout. Ранее это
  приводило к перекрытиям заголовков, preview и даты обновления.
- Collection card с файлами и без файлов — один компонент с разными
  состояниями, без второй вложенной карточки и без тени.
- На hover card collection: чёрная заливка 2% вместо `fill-gamma`.
- Preview-grid внутри collection использует квадратные ячейки; реальные
  изображения — `object-fit: cover`; одинаковый radius у всех углов.
- Empty preview ячейки не должны иметь пунктирных контуров.
- Extra `+N` tile имеет radius и overlay black 4%.
- Hover по preview: overlay black 16% и маленький чёрный tooltip без стрелки,
  radius 16px; изображение имеет внутренний 1px black shadow вместо border.
- Search в Collections: если введён запрос, вместо карточек collections
  показывать найденные файлы в list view.
- Search и list/grid controls должны использовать те же typography, color,
  icon alignment и focus/hover, что и controls основного Spaces screen.
- В раскрытом поиске справа не показывать дополнительную search icon рядом
  с grid/list toggle.
- В Tabs v2 list view для Renders показывать отдельные колонки Project и
  Resolution. Допустимые значения Resolution: `4K`, `2K`, `FHD`, `HD`,
  `Draft`; `draft=1` имеет приоритет над dimensions.
- Для Tabs:
  - files grid — 5 колонок на широком layout, адаптивный;
  - list view должен быть одной строкой на файл и по структуре совпадать
    с list в Collections;
  - согласованный CSS контракт:

```css
.spaces-tabs-files.is-list-view .spaces-tabs-file {
  display: grid;
  grid-template-columns: 52px minmax(180px, .75fr) minmax(104px, .25fr) 40px;
  column-gap: 12px;
  align-items: center;
  min-height: 52px;
  padding: 4px;
  border-radius: 12px;
  color: var(--space-neutral-text-beta, #575757);
  font: 400 14px / 20px "Open Sans", Arial, sans-serif;
  letter-spacing: -.14px;
  transition: background-color 120ms ease;
}
```

- Tabs navigation CSS, согласованный ранее:

```css
.spaces-tabs-list {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid #f1f1f1;
  padding: 0 8px;
}

.spaces-tabs-list > button {
  position: relative;
  flex: 0 0 auto;
  height: 48px;
  padding: 4px 8px 10px;
  border: 0;
  color: var(--space-neutral-text-beta, #747474);
  cursor: pointer;
  font: 600 16px / 24px "Open Sans", Arial, sans-serif;
  letter-spacing: -.16px;
  white-space: nowrap;
  background: transparent;
}
```

## 8. Известные ошибки и технический долг

Ниже — проблемы, зафиксированные последними проверками. Перед исправлением
сначала воспроизвести на Demo и Evelina.

1. **Dev server / build cache.** Был runtime error:
   `Cannot find module './382.js'` из `.next/server/webpack-runtime.js`.
   Обычно это повреждённый Next dev cache. Остановить сервер, удалить
   `.next`, запустить корректный app из `apps/spaces-2-0`.
2. **Home screen:** начата, но не завершена перевёрстка по `Home 2.png`.
3. **Preview placeholders:** были случаи broken image у Documents и
   неправильного сосуществования placeholder с реальным preview.
4. **Collections search:** в некоторых состояниях инпут принимал текст, но
   не заменял collection cards выдачей files list.
5. **List view previews:** были пустые preview в list view; нужно использовать
   единый resolver URL для всех представлений.
6. **Left rail:** ранее ломалась высота раскрытых Documents/папок, пропадали
   chevron, overlap-ились items, пропадал truncate и показывались 0-count.
7. **Tabs:** проверить, что data source выбранного пользователя используется
   и для tabs, и для collection pages; были случаи пустого tabs-контента.
8. **Pin:** пользователь Evelynа воспроизводил ошибку подмены данных:
   после pin New Space и перехода в него pinned item становился Alexey.
   Не использовать index массива как React key или идентификатор Space;
   pinned и обычный список должны ссылаться на стабильный `space.id`.
9. **Header scroll state:** после перехода со страницы с прокруткой могла
   оставаться линия под fixed header, даже когда новая страница вверху.
10. **Отладочная разметка:** на UI попадала overlay-разметка `Gap` с
    розовыми направляющими. Проверить devtools/design extension или код,
    который добавляет debug overlay, и выключить его для прототипа.
11. **Hover курсор:** ранее дёргался при наведении на controls. Проверить,
    что hover не меняет размер/позицию hit-area и не создаёт layout shift.

## 9. Хранение состояния и данные

Ожидаемая модель:

- UI-профиль хранится локально (ранее использовалось локальное сохранение);
- pinned Spaces, порядок pinned, раскрытые Space/collection состояния и
  отображаемый лимит Spaces также сохраняются локально;
- выбранный user, route и выбранный Space/collection являются источником
  текущего экрана;
- URL/history — источник правды для навигации, чтобы Back/Forward работал;
- scroll positions хранить по стабильному route key, не только глобально.

Перед модификацией проверить фактическую реализацию:

```bash
rg -n "localStorage|sessionStorage|history.pushState|popstate|scrollRestoration|router" .
rg -n "evelina|folders.csv|screenshots.csv|pinned|profile" .
```

Нельзя связывать состояния с визуальной позицией элемента в списке. Для данных
Evelina обязательно использовать стабильные IDs из экспорта.

## 10. Ключевые каталоги и файлы

Подтверждённые из задачи:

| Путь | Назначение |
| --- | --- |
| `HANDOFF.md` | Этот документ. |
| `public/evelinas_data/` | Экспорт данных Evelina; источник Spaces, файлов, screenshots и folders. |
| `public/vanessas_data/` | Полный экспорт Vanessa: Spaces, floorplans, screenshots, moodboards, AI Studio, documents и два вида folders. |
| `public/natalias_data/` | Экспорт Natalia: Spaces, projects, screenshots, moodboards, AI Studio, documents и folders. |
| `public/spaces-static/assets/js/spaces-account-data.js` | Общий CSV adapter для профилей Evelina, Vanessa и Natalia, нормализация типов и preview URL. |
| `public/icons/` | Добавленные SVG-иконки left rail и controls. |
| `public/spaces-static/` | Локальные legacy/static assets интерфейса Spaces. |
| `public/spaces-static/assets/images/sidebar/chevron-down.svg` | Правильная иконка chevron left rail. |
| `public/spaces-static/assets/images/spaces-v2/` | Изображения/иконки для пустых collection cards; проверить фактическое содержимое. |
| `public/` | Пользователь положил изображения For you для Home screen; найти точные имена до импорта. |

Точный список добавленных/изменённых/удалённых исходных файлов не нужно
угадывать. Получить его так:

```bash
git status --short
git diff --name-status
git diff --stat
git log --name-status -5
```

После следующей законченной задачи обновить эту секцию конкретными путями и
кратким описанием каждого изменения.

## 11. Архитектура и границы

По `AGENTS.md` родительского репозитория Spaces 2.0 — отдельная standalone
Web Spaces lab. Она визуально повторяет `/spaces`, но изолирована от
onboarding/auth/paywall runtime.

Не переносить screen-level код между:

- Home Funnel;
- legacy/mobile PWA;
- `apps/spaces-2-0`.

Для общего кода предпочтительны доменные типы, tokens, API adapters и UI
primitives. Page-specific styles, mock data и temporary assets должны оставаться
в зоне Spaces lab.

Полезные области для поиска в коде:

```bash
find app components lib public -maxdepth 3 -type f 2>/dev/null | sort
rg -n "spaces-main-content|spaces-tabs|spaces-sidebar|spaces-more-popover" .
rg -n "Profile|Users|Inside page|Collections type" .
```

## 12. Стек, сервисы и интеграции

Подтверждённые/наблюдаемые:

- Next.js: на runtime overlay ранее отображалась версия **15.5.14**;
  сверить с `package.json`.
- JavaScript/TypeScript, HTML/CSS, статические SVG/PNG/WebP assets.
- Vercel для preview/test деплоев.
- Planner 5D object storage для публичных preview URL.
- Локальные CSV-данные Evelynа.

Не подтверждено этим handoff и требует проверки:

- фактический package manager (npm/pnpm/yarn);
- наличие TypeScript, ESLint, unit/e2e tests;
- Vercel project name, link и environment variables;
- наличие API routes и настоящей auth-интеграции.

Не добавлять секреты в этот документ или репозиторий.

## 13. Локальный запуск

### Обычный сценарий

```bash
cd "/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0"
npm install
npm run dev
```

Открыть URL, указанный Next dev server (обычно `http://localhost:3000`).

### Если появляется missing chunk / Internal Server Error

```bash
cd "/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0"
pkill -f "next dev" || true
rm -rf .next
npm run dev
```

Проверить, что сервер запущен именно из `apps/spaces-2-0`, а не из
родительского Onboarding repo или другого проекта.

### Проверки

Не выдумывать scripts. Сначала:

```bash
npm run
```

Затем выполнять только существующие команды, обычно:

```bash
npm run build
npm run lint
npm run typecheck
npm test
```

Если какого-то script нет — зафиксировать это в PR/коммите, а не подменять
результат.

## 14. Vercel: безопасный деплой

### Правило окружений

Сначала использовать **Test/Preview**. Не деплоить Production без отдельного
явного запроса пользователя.

### Перед ручным деплоем

```bash
cd "/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0"
git branch --show-current
ls -la .vercel 2>/dev/null || true
cat .vercel/project.json 2>/dev/null || true
vercel whoami
```

Проверить, что `.vercel/project.json` указывает на нужный preview-проект, а
не на стабильную ссылку.

### Ручной preview deploy

Если Vercel CLI уже linked к тестовому проекту:

```bash
vercel
```

Для неинтерактивного preview, если проект уже настроен:

```bash
vercel --yes
```

Production-команду `vercel --prod` не выполнять без отдельного разрешения.
Если в корневом `package.json` доступны скрипты из AGENTS.md, использовать
их предпочтительно:

```bash
npm run vercel:use:test
npm run deploy:test
```

Известный отдельный Evelyn preview ранее создавался как другой Vercel project/
deployment и должен оставаться публичным только после проверки Vercel access
settings. Если preview отправляет на login, это конфигурация Vercel Deployment
Protection, а не UI-авторизация приложения.

## 15. Git workflow

Работать локально, не push без явного запроса.

```bash
cd "/Users/oleg/Documents/My projects/Onboarding/apps/spaces-2-0"
git status
git switch -c codex/<short-task-name>
git add <exact-files>
git commit -m "feat(spaces): <summary>"
git push -u origin codex/<short-task-name>
```

Затем создать Pull Request через GitLab/GitHub UI или используемый CLI. Перед
push проверить remote:

```bash
git remote -v
```

Не выполнять `git reset --hard` или `git checkout --` в dirty worktree.

## 16. Приоритет следующей работы

1. Убедиться, что dev server стабильно запускается из правильного проекта;
   устранить stale `.next` / missing chunk.
2. Закончить Home screen по `/Users/oleg/Desktop/Home 2.png`:
   адаптировать существующие компоненты, использовать положенные в `public/`
   изображения For you, проверить Home с Create Buttons On/Off.
3. Проверить resolver preview во всех четырёх местах: Collection cards,
   Collection list view, Inside V4 grid/list, Tabs grid/list.
4. Сделать один data selector для Demo/Evelina и применить его одинаково к
   Space root, collections, folders, tabs, list view и left rail.
5. Исправить rail hierarchy: stable `space.id`, no index keys, top-level
   folders, chevrons, count rules, truncate, отсутствие overlap.
6. Закрыть navigation regression:
   - Space → collection: сохранить Space + selected collection;
   - другой Space из collection: открыть root другого Space;
   - Tabs: active tab = selected left rail collection;
   - Back/Forward и scroll restoration.
7. Убрать debug overlay, проверить hover cursor и stale header divider.
8. Прогнать все базовые профили на обоих users, только затем создавать новый
   отдельный Vercel preview.

## 17. Минимальный smoke checklist перед handoff/deploy

- [ ] Logo и Home item открывают Home.
- [ ] Demo и Evelina переключаются без смешивания данных.
- [ ] Pin/unpin не меняет название/аватар/ID другого Space.
- [ ] Show all не показывает Spaces другого пользователя.
- [ ] Space root и collection правильно подсвечены в rail.
- [ ] Клик по другому Space из collection открывает его root.
- [ ] Collections без файлов остаются видимыми с корректной placeholder icon.
- [ ] В Documents нет broken image.
- [ ] Search в collection показывает file-list results.
- [ ] Grid/list показывает одинаковый набор данных и preview.
- [ ] Tabs использует реальные данные активного Space.
- [ ] Папки показываются только для текущей collection и только верхнего уровня.
- [ ] No `0` badge; collection с folders показывает chevron.
- [ ] Back/Forward и scroll restoration работают.
- [ ] Нет debug overlays, stale header line, layout overlap или дрожащего cursor.
- [ ] Проверена сборка и соответствующий preview Vercel.
