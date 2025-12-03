#!/usr/bin/env python3
"""
MGNREGA Pie Chart Generator - Optimized Version
Generates compact, beautiful pie charts matching the original design
"""

import warnings
warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys
import json
import base64
from io import BytesIO

# Suppress matplotlib warnings
import logging
logging.getLogger('matplotlib').setLevel(logging.WARNING)

def create_pie_chart(data, chart_type):
    """Create a compact pie chart matching original design"""
    
    # Smaller figure size for compact charts (was 8,6 - now 6,5)
    plt.figure(figsize=(6, 5))
    
    if chart_type == 'employment':
        labels = ['Got Work', "Didn't Get Work"]
        sizes = [
            data['personsEmployed'],
            data['personsDemanded'] - data['personsEmployed']
        ]
        colors = ['#2ecc71', '#e74c3c']
        explode = (0.05, 0)
        
    elif chart_type == 'expenditure':
        labels = ['Wages Paid', 'Material Cost', 'Administration']
        sizes = [
            data['wages'],
            data['material'],
            data['admin']
        ]
        colors = ['#3498db', '#f39c12', '#9b59b6']
        explode = (0.05, 0, 0)
        
    elif chart_type == 'works':
        labels = ['Completed Works', 'In Progress', 'Not Started']
        total = data['total']
        completed = data['completed']
        inProgress = data['inProgress']
        notStarted = max(0, total - completed - inProgress)
        
        sizes = [completed, inProgress, notStarted]
        colors = ['#27ae60', '#f39c12', '#95a5a6']
        explode = (0.05, 0, 0)
    else:
        raise ValueError(f'Unknown chart type: {chart_type}')
    
    # Create compact pie chart with better styling
    plt.pie(sizes, explode=explode, labels=labels, colors=colors,
            autopct='%1.1f%%', shadow=True, startangle=90,
            textprops={'fontsize': 11, 'weight': 'bold'})
    
    plt.axis('equal')
    
    # Use tight layout to minimize whitespace
    plt.tight_layout()
    
    # Save with optimized settings for smaller file size
    buffer = BytesIO()
    plt.savefig(buffer, 
                format='png', 
                bbox_inches='tight', 
                dpi=100,  # Reduced from 150 for smaller file
                facecolor='white',
                edgecolor='none')
    buffer.seek(0)
    
    # Convert to base64
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    plt.close()
    
    return image_base64

def main():
    """Main function to process command line arguments"""
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                'success': False,
                'error': 'No data provided'
            }))
            sys.exit(1)
        
        input_data = json.loads(sys.argv[1])
        chart_type = input_data.get('chartType')
        data = input_data.get('data')
        
        if not chart_type or not data:
            print(json.dumps({
                'success': False,
                'error': 'Missing chartType or data'
            }))
            sys.exit(1)
        
        # Generate chart
        image_base64 = create_pie_chart(data, chart_type)
        
        # Return result as JSON
        result = {
            'success': True,
            'image': image_base64,
            'chartType': chart_type
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()