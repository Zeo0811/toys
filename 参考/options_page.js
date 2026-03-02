$(document).ready(function () {
	let vipTime = 'MONTH'
	$('.pay-month-btn').click(function () {
		$('.base-price-display').text('8.6￥/月')
		$('.pro-price-display').text('12.9￥/月')
		vipTime = 'MONTH'
	})
	$('.pay-year-btn').click(function () {
		$('.base-price-display').text('68￥/年')
		$('.pro-price-display').text('99￥/年')
		vipTime = 'YEAR'
	})
	$('.pay-btn').click(async function () {
		const vipType = $(this).attr('vip-type')
		$.ajax({
			type: 'get',
			url: `${domain}/api/price?type=${vipType}_${vipTime}`,
			contentType: 'application/json',
			headers: {
				...await getHeader()
			},
			success: function (res) {
				onPay(res.data, `${vipType}_${vipTime}`)
			}
		})
	})
})
