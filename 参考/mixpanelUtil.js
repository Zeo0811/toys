async function trackEvent(event) {
	$.ajax({
		type: 'post',
		url: `${domain}/api/Event/track`,
		contentType: 'application/json',
		data: JSON.stringify(event),
		headers: {
			...await getHeader()
		},
		success: function (res) {
			console.log('send event', res)
		}
	})
}