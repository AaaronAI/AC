document.addEventListener('DOMContentLoaded', () => {
    const fetchDataButton = document.getElementById('fetchDataButton');
    const marketIdInput = document.getElementById('marketId');
    const rawDataPre = document.getElementById('rawData');
    const ctx = document.getElementById('priceChart').getContext('2d');
    let priceChart;

    fetchDataButton.addEventListener('click', fetchData);

    async function fetchData() {
        const marketId = marketIdInput.value;
        if (!marketId) {
            rawDataPre.textContent = 'Please enter a Market ID.';
            return;
        }

        try {
            const marketDetailsResponse = await fetch(`/api/market-data?market_id=${marketId}`);
            if (!marketDetailsResponse.ok) {
                throw new Error(`HTTP error fetching market details! status: ${marketDetailsResponse.status}`);
            }
            const marketDetails = await marketDetailsResponse.json();
            rawDataPre.textContent = JSON.stringify(marketDetails, null, 2);

            const candlesResponse = await fetch(`/api/market-candles?market_id=${marketId}&time_span=1d&candle_size=1h`);
            if (!candlesResponse.ok) {
                throw new Error(`HTTP error fetching candle data! status: ${candlesResponse.status}`);
            }
            const candlesData = await candlesResponse.json();

            const labels = [];
            const prices = [];

            if (candlesData.candles && Array.isArray(candlesData.candles)) {
                candlesData.candles.forEach(candle => {
                    labels.push(new Date(candle.time).toLocaleString());
                    prices.push(candle.close / 100);
                });
            }

            renderChart(labels, prices);
        } catch (error) {
            rawDataPre.textContent = `Error: ${error.message}`;
            console.error('Error fetching market data:', error);
        }
    }

    function renderChart(labels, data) {
        if (priceChart) {
            priceChart.destroy();
        }

        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Closing Price ($)',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: false,
                    pointRadius: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Price ($)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    fetchData();
});
