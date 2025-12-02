document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (!file) {
        alert('Please select an image file.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    // Preview the image before sending it for classification
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageElement = document.getElementById('uploadedImage');
        imageElement.src = e.target.result;
        document.getElementById('imagePreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Disable the upload input during processing
    document.getElementById('fileInput').disabled = true;

    // Make the POST request to the Flask backend
    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Enable the upload input after processing
        document.getElementById('fileInput').disabled = false;

        // Update the UI with the prediction result
        document.getElementById('results').style.display = 'block';
        
        // Create a visually appealing version for disease classification
        let diseaseText = '';
        let diseaseColor = '';
        let diseaseIcon = '';

        switch (data.prediction) {
            case 'potato_healthy':
                diseaseText = 'Healthy Leaves';
                diseaseColor = '#16a34a'; // Green for healthy
                diseaseIcon = '🍀';
                break;
            case 'potato_early_blight':
                diseaseText = 'Early Blight';
                diseaseColor = '#fbbf24'; // Yellow for early blight
                diseaseIcon = '💧';
                break;
            case 'potato_late_blight':
                diseaseText = 'Late Blight';
                diseaseColor = '#ef4444'; // Red for late blight
                diseaseIcon = '🌬️';
                break;
            default:
                diseaseText = 'Unknown';
                diseaseColor = '#6b7280'; // Gray for unknown
                diseaseIcon = '❓';
        }

        document.getElementById('result-disease').innerHTML = `${diseaseIcon} <span style="color: ${diseaseColor}; font-weight: bold;">${diseaseText}</span>`;

        // Update confidence value
        document.getElementById('confidence-value').textContent = (data.probability * 100).toFixed(2) + '%';

        // Update the confidence bar with animation
        const confidenceBar = document.getElementById('confidence-bar');
        confidenceBar.style.transition = 'width 1s ease-out'; // Smooth transition
        confidenceBar.style.width = data.probability * 100 + '%';

        // Change the color of the confidence bar based on the prediction confidence
        if (data.probability >= 0.8) {
            confidenceBar.classList.remove('confidence-fill-low', 'confidence-fill-medium');
            confidenceBar.classList.add('confidence-fill-high');
        } else if (data.probability >= 0.5) {
            confidenceBar.classList.remove('confidence-fill-low', 'confidence-fill-high');
            confidenceBar.classList.add('confidence-fill-medium');
        } else {
            confidenceBar.classList.remove('confidence-fill-high', 'confidence-fill-medium');
            confidenceBar.classList.add('confidence-fill-low');
        }

        // Update description and treatment based on the prediction
        const description = {
            "potato_healthy": "Healthy leaves, no disease.",
            "potato_early_blight": "Early blight causes dark brown spots with concentric rings.",
            "potato_late_blight": "Late blight shows water-soaked lesions that turn brown."
        };

        const treatment = {
            "potato_healthy": "No treatment necessary. Keep the plant well-watered and healthy.",
            "potato_early_blight": "Apply fungicides, remove infected leaves, and ensure proper air circulation.",
            "potato_late_blight": "Apply fungicides immediately, remove infected parts, and improve drainage."
        };

        document.getElementById('result-description').textContent = description[data.prediction] || 'No description available.';
        document.getElementById('result-treatment').textContent = treatment[data.prediction] || 'No treatment available.';

    })
    .catch(error => {
        // Enable the upload input in case of an error
        document.getElementById('fileInput').disabled = false;

        console.error('Error:', error);
        alert('Error processing the image. Please try again.');
    });
});
