// Map Initialization
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('dashboard-map');
    if (mapContainer) {
        const map = L.map('dashboard-map').setView([28.6139, 77.2090], 13); // New Delhi coordinates

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Mock Vehicle Data
        const vehicles = [
            { id: 'TUK-88', lat: 28.6129, lng: 77.2295, status: 'moving' },
            { id: 'TUK-12', lat: 28.6200, lng: 77.2100, status: 'moving' },
            { id: 'TUK-45', lat: 28.6000, lng: 77.2000, status: 'idle' },
            { id: 'TUK-09', lat: 28.6300, lng: 77.2300, status: 'stopped' },
        ];

        vehicles.forEach(vehicle => {
            const color = vehicle.status === 'moving' ? 'green' : (vehicle.status === 'idle' ? 'orange' : 'red');

            const circleMarker = L.circleMarker([vehicle.lat, vehicle.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                radius: 8
            }).addTo(map);

            circleMarker.bindPopup(`<b>${vehicle.id}</b><br>Status: ${vehicle.status}`);
        });
    }
});
