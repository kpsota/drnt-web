fetch('content.json')
	.then(r => r.json())
	.then(c => {
		const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

		document.querySelectorAll('[data-content]').forEach(el => {
			const val = get(c, el.dataset.content);
			if (val === undefined) return;
			el.innerHTML = Array.isArray(val) ? val.join(', ') : val;
		});

		const templates = {
			service: item => `
				<section>
					<a href="#" class="image"><img src="${item.image}" alt="${item.alt}" data-position="${item.position || 'center center'}" /></a>
					<div class="content">
						<div class="inner">
							<h2>${item.title}</h2>
							<p>${item.text}</p>
						</div>
					</div>
				</section>`,
			founder: item => `
				<section>
					<span class="icon solid major fa-${item.icon}"></span>
					<h3>${item.name}</h3>
					<p><em>${item.role}</em></p>
					<p>${item.bio}</p>
				</section>`,
			pillar: item => `
				<section>
					<span class="icon solid major fa-${item.icon}"></span>
					<h3>${item.title}</h3>
					<p>${item.text}</p>
				</section>`,
			reference: item => `
				<section>
					<span class="icon solid major fa-${item.icon}"></span>
					<h3>${item.client}</h3>
					<p>${item.task}</p>
					<p><strong>${item.tag}</strong></p>
				</section>`,
		};

		document.querySelectorAll('[data-array]').forEach(el => {
			const items = get(c, el.dataset.array);
			const tmpl = templates[el.dataset.template];
			if (!Array.isArray(items) || !tmpl) return;
			el.innerHTML = items.map(tmpl).join('');
		});

		// Re-run spotlight image init that main.js missed (sections didn't exist yet)
		document.querySelectorAll('.spotlights > section .image').forEach(imageEl => {
			const img = imageEl.querySelector('img');
			if (!img) return;
			imageEl.style.backgroundImage = `url(${img.src})`;
			if (img.dataset.position) imageEl.style.backgroundPosition = img.dataset.position;
			img.style.display = 'none';
		});

		document.title = c.meta.title;
	});
