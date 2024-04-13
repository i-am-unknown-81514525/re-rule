const query = new URLSearchParams(window.location.search);
let search = null
if (query.has('search')) {
    search = query.get('search');
}

const flagmatcher = /\(\?-?.\)/g;

fetch('rule.json')
    .then(response => response.json())
    .then(rules => {
        const cardContainer = document.getElementById('cardContainer');
        const filterContainer = document.getElementById('filterContainer');
        const modal = document.getElementById('revisionModal');
        const closeModal = document.getElementsByClassName('close')[0];
        const notification = document.getElementById('notification');

        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        window.addEventListener('click', event => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        const tags = [...new Set(rules.flatMap(rule => rule.tag))];

        // Generate filter buttons
        tags.forEach(tag => {
            const button = document.createElement('span');
            button.textContent = tag;
            button.classList.add('tag');
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                renderCards();
            });
            filterContainer.appendChild(button);
        });

        const searchInput = document.getElementById('searchInput');

        searchInput.addEventListener('input', () => {
            renderCards();
        });

        const searchInput_rg = document.getElementById('searchInput_rg');

        searchInput_rg.addEventListener('input', () => {
            renderCards()
        });

        if (search != null) {
            searchInput.value = search
            renderCards()
        }

        // Render cards based on selected tags
        function renderCards() {
            cardContainer.innerHTML = '';

            const selectedTags = Array.from(filterContainer.getElementsByClassName('active')).map(button => button.textContent);
            const searchTerm = searchInput.value.toLowerCase();

            let count_title = true;
            rules.forEach(rule => {
                if (String(rule.id).includes(searchTerm)) {
                    count_title = false;
                }
            });

            rules.forEach(rule => {
                let thisRegex = rule.regex
                const flags = rule.regex.match(flagmatcher);
                let pureflags = '';
                for (let flag in flags) {
                    let act_flag = flag[2];
                    if (act_flag === '-') {
                        act_flag = flag[3];
                        continue;
                    }
                    if (act_flag === 'i' || act_flag === 'm') {
                        pureflags += act_flag;
                    }
                    if (act_flag === 's') {
                        thisRegex = thisRegex.replace('.', '(.|\\n)')
                    }
                }
                thisRegex = thisRegex.replace(flagmatcher, '');
                thisRegex = thisRegex.replace('/', '\/');
                console.log(thisRegex)
                if (
                    (selectedTags.length === 0 || selectedTags.every(tag => rule.tag.includes(tag))) &&
                    ((count_title && rule.name.toLowerCase().includes(searchTerm)) || String(rule.id).includes(searchTerm)) && (!(searchInput_rg.value) || searchInput_rg.value.match(new RegExp(thisRegex, pureflags)))
                ) {
                    const card = document.createElement('div');
                    card.classList.add('card');

                    const name = document.createElement('h2');
                    name.textContent = rule.name;
                    card.appendChild(name);

                    const regexContainer = document.createElement('div');
                    regexContainer.innerHTML = `<strong>Regex:</strong> `;

                    const regex = document.createElement('span');
                    regex.classList.add('regex');
                    regex.textContent = rule.regex;
                    regex.addEventListener('click', () => {
                        navigator.clipboard.writeText(rule.regex);
                        showNotification();
                    });
                    regexContainer.appendChild(regex);

                    card.appendChild(regexContainer);

                    const tags = document.createElement('p');
                    tags.innerHTML = `<strong>Tags:</strong> ${rule.tag.join(', ')}`;
                    card.appendChild(tags);

                    const ID = document.createElement('p');
                    ID.innerHTML = `<strong>ID:</strong> ${rule.id}`;
                    card.appendChild(ID);

                    if (rule.example && rule.example.length > 0) {
                        const examples = document.createElement('div');
                        examples.innerHTML = `<strong>Examples:</strong><br>`;
                        rule.example.forEach(example => {
                            const exampleElement = document.createElement('div');
                            exampleElement.classList.add('example');
                            exampleElement.textContent = example;
                            exampleElement.addEventListener('click', () => {
                                navigator.clipboard.writeText(example);
                                showNotification_example();
                            })
                            examples.appendChild(exampleElement);
                        });
                        card.appendChild(examples);
                    }

                    if (rule.inherit && rule.inherit.length > 0) {
                        const inherit = document.createElement('div');
                        const total = rule.inherit.length
                        let current = 0
                        inherit.innerHTML = `<strong>Inherit:</strong>`;
                        rule.inherit.forEach(id => {
                            const button = document.createElement('span');
                            button.textContent = id;
                            button.classList.add('tag');
                            button.classList.add('inherit_tag');
                            button.addEventListener('click', () => {
                                window.location.href = '?search=' + id;
                            });
                            inherit.appendChild(button);
                            // const inheritElement = document.createElement('a')
                            // inheritElement.href = '?search='+id
                            // inheritElement.innerHTML = id
                            // inherit.appendChild(inheritElement)
                            // current += 1
                            // if (current !== total) {
                            //     inherit.insertAdjacentText('beforeend', ', ')
                            //     inherit.appendChild(document.createElement('wbr'))
                            // }
                        })
                        card.appendChild(inherit);
                    }

                    if (rule.revision && rule.revision.length > 0) {
                        const revisionButton = document.createElement('button');
                        revisionButton.textContent = 'View Revisions';
                        revisionButton.classList.add('revision-button');
                        revisionButton.addEventListener('click', () => {
                            const revisionContent = document.getElementById('revisionContent');
                            revisionContent.innerHTML = '';

                            rule.revision.forEach(revision => {
                                const revisionElement = document.createElement('div');
                                revisionElement.innerHTML = `
                  <p><strong>Regex:</strong> <span class="regex">${revision.regex.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span></p>
                  <p><strong>Reason:</strong> ${revision.reason}</p>
                  <hr>
                `;
                                revisionContent.appendChild(revisionElement);
                            });

                            modal.style.display = 'block';
                        });
                        card.appendChild(revisionButton);
                    }

                    cardContainer.appendChild(card);
                }
            });
        }

        function showNotification() {
            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
        }

        function showNotification_example() {
            notification_example.style.display = 'block';
            setTimeout(() => {
                notification_example.style.display = 'none';
            }, 2000);
        }

        renderCards();
    })
    .catch(error => {
        console.error('Error fetching rules:', error);
    });
