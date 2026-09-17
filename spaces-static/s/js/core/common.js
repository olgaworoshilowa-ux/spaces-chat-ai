const App = {}

App.Utils = {
    getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth
    }
}

App.Modal = {}

App.Modal.rootEl = document.documentElement
App.Modal.$modals = $(".modal, .b-modal")
App.Modal.$modalCloses = $(".modal-background, .modal-close, .modal-card .modal-card-close, .modal-card-head .delete, .js-modal-close")

App.Modal.init = function init() {
    document.addEventListener("keydown", (event) => {
        const e = event || window.event
        if(e.keyCode === 27) {
            App.Modal.closeAll()
        }
    })
    $(document).on("click", "*[data-modal]", function() {
        const target = $(this).data("modal")
        App.Modal.show(target)
    })

    if(App.Modal.$modalCloses) {
        App.Modal.$modalCloses.each(function() {
            const $el = $(this)
            $el.on("click", () => {
                App.Modal.closeAll()
            })
        })
    }
}

App.Modal.show = function show(target, options = {}) {
    App.Modal.closeAll()
    const $target = $(target)
    const {highlightElement} = options
    if($target.length) {
        const scrollWidth = App.Utils.getScrollbarWidth()
        App.Modal.rootEl.classList.add("is-clipped")
        if(scrollWidth < 20) {
            ["body"].forEach((selector) => {
                const el = document.querySelector(selector)
                if(el) {
                    document.querySelector(selector).style.paddingRight = `${scrollWidth}px`
                }
            })
        }

        if(highlightElement) {
            const $highlightElement = $(highlightElement)
            const $backdrop = $target.find(".b-modal__backdrop")
            $backdrop.bind("click", function(e) {
                $highlightElement.trigger(e)
            })
            const elemRect = $highlightElement[0].getBoundingClientRect()
            const {
                top, left,
                width, height
            } = elemRect
            $target.addClass("is-highlight")
            const backdropRect = {
                top: top,
                left: left,
                width, height
            }
            $backdrop.css(backdropRect)
        }

        $target.addClass("is-active")
    } else {
        // eslint-disable-next-line no-console
        console.log(`Not found modal: ${target}`)
    }
}

App.Modal.close = function close() {

}

App.Modal.closeAll = function closeAll() {
    App.Modal.rootEl.classList.remove("is-clipped");
    ["body", "#header", "#subheader"].forEach((selector) => {
        const el = document.querySelector(selector)
        if(el) {
            document.querySelector(selector).style.paddingRight = ""
        }
    })
    App.Modal.$modals.each(function() {
        const $el = $(this)
        $el.removeClass("is-active")
    })
}

// $(() => {
//   App.Modal.show('#modal-confirmTerms');
//   $('#termsAgreeBtn').on('click', App.Modal.closeAll);
//
//   $('#modal-cookies-policy .button').on('click', () => {
//     $('#modal-cookies-policy').hide();
//   });
// });

$("*[data-click-scroll]").on("click", function(e) {
    e.preventDefault()

    $("html, body").stop().animate({
        scrollTop: $($(this).data("click-scroll")).offset().top - parseInt($("#header").height())
    }, 400)
})

$(() => {
    const $navbarBurgers = $(".navbar-burger")

    if($navbarBurgers.length) {
        // Add a click event on each of them
        $navbarBurgers.each(function() {
            const $el = $(this)

            $el.on("click", (e) => {
                e.preventDefault()

                const target = $el.data("target")
                const $target = $(target)

                $el.toggleClass("is-active")
                $target.toggleClass("is-active")
            })
        })
    }
})

$(() => {
    $(".b-tip__tooltip-close").on("click", function() {
        $(this).parents(".b-tip").removeClass("is-active")
    })

    $(".js-pricing-tabs").each(function() {
        const $el = $(this)
        const $tabs = $el.find(".js-pricing-tab")
        const $contents = $el.find(".js-pricing-tab-content")
        $tabs.on("click", function(e) {
            e.preventDefault()
            $tabs.removeClass("is-active")
            $(this).addClass("is-active")
            $contents.removeClass("is-active").addClass("is-hidden")
            $($(this).attr("data-tab")).removeClass("is-hidden").addClass("is-active")
        })
    })
})

$(() => {
    function closeAllDropdowns() {
        $(".dropdown").removeClass("is-active")
    }

    $(document).on("click", closeAllDropdowns)

    $(document).on("click", ".dropdown-trigger", (event) => {
        if($(this).hasClass("is-hovered")) {
            if($(window).width() > 769) {
                event.preventDefault()
                event.stopPropagation()
            }
        } else {
            event.preventDefault()
            event.stopPropagation()
            closeAllDropdowns()
            const $dropdown = $(this).parents(".dropdown").first()
            // var $dropdown_trigger = $(this);
            // var $dropdown_menu = $dropdown.find('.dropdown-menu').first();

            $dropdown.toggleClass("is-active")
        }
        return false
    })

    // Dropdowns

    // var $dropdowns = $('.dropdown:not(.is-hoverable)');
    //
    // if ($dropdowns.length > 0) {
    //     $dropdowns.each(function () {
    //         var $el = $(this);
    //         $el.on('click', function (event) {
    //             event.stopPropagation();
    //             $el.toggleClass('is-active');
    //         });
    //     });
    //
    //     $(document).on('click', function (event) {
    //         closeDropdowns();
    //     });
    // }
})

$(() => {
    if(typeof $.fn.fancybox === "function") {
        $("[data-fancybox]").fancybox()
    }

    $(".js-password-toggle").on("click", function() {
        const input = $(this).prev()
        input.attr("type", input.attr("type") === "password" ? "text" : "password")
    })
})

function renderLanguageSelectOption(data, isLabel) {
    const value = data.value.trim()
    const text = data.text.trim()
    return `<span class="selectric-option"><span>${text}</span>${isLabel ? "<i></i>" : ""}</span>`
}

if(typeof $.fn.selectric === "function") {
    $("footer > div:nth-child(2) select").selectric({
        onChange(element) {
            const value = $(element).val()
            const href = `${value === "en" ? "" : `/${value}${document.location.pathname}`}?setLang=${value}`
            document.location.pathname = href
        },
        optionsItemBuilder(data) {
            return renderLanguageSelectOption(data)
        },
        labelBuilder(data) {
            return renderLanguageSelectOption(data, true)
        }
    })
}

const headerFloatOffset = 600
const headerFloatProgressOffset = 50
let Header = {}
let
    SubHeader = {}

$(() => {
    Header = {
        $el: $("header"),
        $burger: $("header > div > button"),
        $menu: $("header > div > div"),
        data_menu: "data-menu",
        data_float: "data-float",
        init() {
            Header.hideMenu()
            Header.unsetFloat()
            Header.fn()
            $(document).on("resize", Header.fn)
            $(document).on("scroll", Header.fn)

            if(Header.exists()) {
                $("body").addClass("has-header")
            } else {
                $("body").removeClass("has-header")
            }

            // initialize click burger
            Header.$burger.on("click", (e) => {
                e.preventDefault()
                Header.toggleMenu()
                return false
            })

            // initialize href click scroll
            $(".js-header-link").filter((i, link) => {
                const href = $(link).attr("href") || $(link).attr("data-href")
                return href && href[0] === "#"
            }).map((i, link) => {
                $(link).on("click", (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    const target = $(link).attr("href") || $(link).attr("data-href")
                    const $target = $(target)

                    if($target.length) {
                        Header.hideMenu()
                        PageScroll.scroll(link)
                    } else {
                        console.log(`not found: ${target}`)
                    }

                    return false
                })
            })
        },
        exists() {
            return Header.$el.length
        },
        fn() {
            const scrollTop = $(document).scrollTop()

            if(scrollTop > headerFloatOffset) {
                Header.setFloat()
            } else if(!Header.isMenuVisible()) {
                if(scrollTop > headerFloatProgressOffset) {
                    Header.setFloatProgress()
                } else {
                    Header.unsetFloat()
                }
            }
        },
        setFloat() {
            if(SubHeader.exists()) {
                Header.$el.attr(Header.data_float, "hide")
            } else {
                Header.$el.attr(Header.data_float, "true")
            }
        },
        setFloatProgress() {
            Header.$el.attr(Header.data_float, "progress")
        },
        unsetFloat() {
            Header.$el.attr(Header.data_float, "false")
        },
        isMenuVisible() {
            return Header.$el.attr(Header.data_menu) === "true"
        },
        toggleMenu() {
            if(Header.isMenuVisible()) {
                Header.hideMenu()
            } else {
                Header.showMenu()
            }
        },
        showMenu() {
            Header.$burger.addClass("is-active")
            Header.$menu.addClass("is-active")
            Header.$el.attr(Header.data_menu, "true")
            $("html").addClass("is-clipped")
        },
        hideMenu() {
            Header.$burger.removeClass("is-active")
            Header.$menu.removeClass("is-active")
            Header.$el.attr(Header.data_menu, "false")
            $("html").removeClass("is-clipped")
        }
    }
})

var PageScroll = {
    scroll(link) {
        const target = $(link).attr("href") || $(link).attr("data-href")
        const $target = $(target)
        const headerOffset = 60
        const subheaderOffset = 44
        const targetOffset = $target.length && $target.offset().top

        const animate = function() {
            const scrollTop = (targetOffset > headerFloatOffset)
                ? targetOffset - subheaderOffset
                : targetOffset - headerOffset - subheaderOffset
            $("html").stop().animate({
                scrollTop
            }, 400)
        }

        if($target.length) {
            SubHeader.hideMenu()
            animate()
        } else {
            console.log(`not found: ${target}`)
        }
    }
}

// subheader
$(() => {
    SubHeader = {
        $el: $("#subheader"),
        $burger: $("#subheader-burger"),
        $menu: $("#subheader-menu"),
        data_menu: "data-menu",
        data_float: "data-float",
        init() {
            SubHeader.hideMenu()
            SubHeader.unsetFloat()
            SubHeader.fn()
            $(document).on("resize", SubHeader.fn)
            $(document).on("scroll", SubHeader.fn)

            if(SubHeader.exists()) {
                $("body").addClass("has-subheader")
            } else {
                $("body").removeClass("has-subheader")
            }

            SubHeader.$burger.on("click", (e) => {
                e.preventDefault()
                SubHeader.toggleMenu()
                return false
            })

            $(".js-subheader-link").filter((i, link) => {
                const href = $(link).attr("href") || $(link).attr("data-href")
                return href && href[0] === "#"
            }).map((i, link) => {
                $(link).on("click", (e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    const target = $(link).attr("href") || $(link).attr("data-href")
                    const $target = $(target)

                    if($target.length) {
                        SubHeader.hideMenu()
                        PageScroll.scroll(link)
                    } else {
                        console.log(`not found: ${target}`)
                    }

                    return false
                })
            })
        },
        exists() {
            return SubHeader.$el.length
        },
        fn() {
            const scrollTop = $(document).scrollTop()

            if(scrollTop > headerFloatOffset) {
                SubHeader.setFloat()
            } else if(!SubHeader.isMenuVisible()) {
                if(scrollTop > headerFloatProgressOffset) {
                    SubHeader.setFloatProgress()
                } else {
                    SubHeader.unsetFloat()
                }
            }
        },
        setFloat() {
            SubHeader.$el.attr(SubHeader.data_float, "true")
        },
        setFloatProgress() {
            SubHeader.$el.attr(SubHeader.data_float, "progress")
        },
        unsetFloat() {
            SubHeader.$el.attr(SubHeader.data_float, "false")
        },
        isMenuVisible() {
            return SubHeader.$el.attr(SubHeader.data_menu) === "true"
        },
        toggleMenu() {
            if(SubHeader.isMenuVisible()) {
                SubHeader.hideMenu()
            } else {
                SubHeader.showMenu()
            }
        },
        showMenu() {
            SubHeader.$burger.addClass("is-active")
            SubHeader.$menu.addClass("is-active")
            SubHeader.$el.attr(SubHeader.data_menu, "true")
            $("html").addClass("is-clipped")
        },
        hideMenu() {
            SubHeader.$burger.removeClass("is-active")
            SubHeader.$menu.removeClass("is-active")
            SubHeader.$el.attr(SubHeader.data_menu, "false")
            $("html").removeClass("is-clipped")
        }
    }
})

$(() => {
    App.Modal.init()
    Header.init()
    SubHeader.init()
})

$(".js-page-scroll").on("click", function(e) {
    PageScroll.scroll(this)
    return false
})

const buttonUp = document.querySelector('.button-up');
if(!!buttonUp) {
    buttonUp.addEventListener("click", smoothScroll);
    function smoothScroll(event) {
        const startPosition = window.pageYOffset;
        const distance = -window.pageYOffset;
        const duration = 500;
        let start = null;
        window.requestAnimationFrame(step);
        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            window.scrollTo(0, easeInOutCubic(progress, startPosition, distance, duration));
            if (progress < duration) window.requestAnimationFrame(step);
        }
    }
    function easeInOutCubic(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t * t + b;
        t -= 2;
        return (c / 2) * (t * t * t + 2) + b;
    }
    let flag = true;
    window.addEventListener('scroll', (e) => {
        if (window.pageYOffset > 400 && !flag) {
            buttonUp.classList.add('is-active');
        }
        if (window.pageYOffset < 400) {
            buttonUp.classList.remove('is-active');
            flag = false;
        }
    });
}

const votingPage = document.querySelector('.modal-db-voting');
if(!!votingPage) {
    const votingElem1 = votingPage.querySelector('.modal-card > div:nth-child(2)');
    const votingElem2 = votingPage.querySelector('.modal-card > div:nth-child(3)');

    votingElem1.addEventListener('click', () => {
        votingElem1.classList.add('is-active');
        votingElem2.classList.remove('is-active');
    })
    votingElem2.addEventListener('click', () => {
        votingElem1.classList.remove('is-active');
        votingElem2.classList.add('is-active');
    })
}


const banner = document.querySelector('.banner');
const banners = document.querySelectorAll('.banner');
if(!!banner) {
    let flag = true;
    window.addEventListener('scroll', (e) => {
        if (window.pageYOffset > 200 && flag) {
            banners.forEach(banner => {
                banner.classList.add('is-active');
            })
        }
        if (window.pageYOffset < 200) {
            banners.forEach(banner => {
                banner.classList.remove('is-active');
            })
            flag = true;
        }
    });
    banners.forEach(banner => {
        banner.addEventListener('click', (e) => {
            if (e.target.closest('.banner > .close')) {
                banner.classList.remove('is-active');
                flag = false;
            }
        })
    })
}

const tabs = document.querySelector(".js-tabs");
const tabButtons = document.querySelectorAll(".js-tablinks > button");
const tabContents = document.querySelectorAll(".js-tabcontent > div");
if (!!tabs) {
    tabs.addEventListener('click', e => {
        let id = e.target.dataset.id;
        if (id) {
            tabButtons.forEach(tabButton => {
                tabButton.classList.remove('is-active');
            });
            e.target.classList.add('is-active');

            tabContents.forEach(tabContent => {
                tabContent.classList.remove('is-active');
            });
            const elementId = document.getElementById(id);
            elementId.classList.add('is-active');
        }
    })
}

const premiumPaywallModal = document.querySelector('.premium-paywall');

if (!!premiumPaywallModal) {
    const premiumPaywallModal1 = document.querySelector('.premium-paywall--1');
    const premiumPaywallModal2 = document.querySelector('.premium-paywall--2');

    if (!!premiumPaywallModal1) {
        const choiceElem1 = document.querySelector('.premium-paywall--1 .modal-card > div:last-of-type > ul > li:first-of-type');
        const choiceElem2 = document.querySelector('.premium-paywall--1 .modal-card > div:last-of-type > ul > li:last-of-type');

        choiceElem1.addEventListener('click', (e) => {
            choiceElem1.classList.add('is-active');
            choiceElem2.classList.remove('is-active');
        })
        choiceElem2.addEventListener('click', (e) => {
            choiceElem1.classList.remove('is-active');
            choiceElem2.classList.add('is-active');
        })
    }

    if (!!premiumPaywallModal2) {
        const promoCodeLink = document.querySelector('.premium-paywall--2 .modal-card > div:last-of-type div:last-of-type > div:nth-child(1) form > a');
        const promoCodeField = document.querySelector('.form__row-promo-code');
        promoCodeLink.addEventListener('click', e => {
            e.preventDefault();
            promoCodeField.classList.toggle('is-active');
        })

        const promoCodeInput = document.querySelector('.premium-paywall--2 .modal-card > div:last-of-type > div:last-of-type > div:nth-child(1) .form__row-promo-code input');
        const promoCodeButton = document.querySelector('.premium-paywall--2 .modal-card > div:last-of-type > div:last-of-type > div:nth-child(1) .form__row-promo-code button');
        promoCodeInput.addEventListener('input', () => {
            if (promoCodeInput.value !== '') {
                console.log(promoCodeInput.value)
                promoCodeButton.disabled = false;
            }
            if (promoCodeInput.value === '') {
                console.log('disabled', promoCodeInput.value)
                promoCodeButton.disabled = 'disabled';
            }
        })
    }
}