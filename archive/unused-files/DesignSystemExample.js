import React, { useState } from 'react';
import {
  Button,
  Input,
  Card,
  Badge,
  Table,
  Modal,
  Loading,
  Alert,
  Container,
  Row,
  Col,
  Divider,
  Spacer
} from './DesignSystem';

// ============================================================================
// DESIGN SYSTEM EXAMPLE - ZEITERFASSUNG APP
// ============================================================================

const DesignSystemExample = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  return (
    <Container>
      <h1>Design System - Zeiterfassung App</h1>
      <p>Einheitliches UI/UX für Monteur und Büro Bereiche</p>
      
      <Spacer size="lg" />
      
      {/* 🎯 BUTTONS */}
      <Card title="Buttons" subtitle="Verschiedene Button-Varianten">
        <Row>
          <Col size="6">
            <h4>Primary Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            
            <h4>Secondary Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button variant="secondary" size="sm">Small</Button>
              <Button variant="secondary" size="md">Medium</Button>
              <Button variant="secondary" size="lg">Large</Button>
            </div>
            
            <h4>Outline Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button variant="outline" size="sm">Small</Button>
              <Button variant="outline" size="md">Medium</Button>
              <Button variant="outline" size="lg">Large</Button>
            </div>
          </Col>
          
          <Col size="6">
            <h4>Ghost Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button variant="ghost" size="sm">Small</Button>
              <Button variant="ghost" size="md">Medium</Button>
              <Button variant="ghost" size="lg">Large</Button>
            </div>
            
            <h4>Danger Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button variant="danger" size="sm">Delete</Button>
              <Button variant="danger" size="md">Remove</Button>
              <Button variant="danger" size="lg">Cancel</Button>
            </div>
            
            <h4>Loading Buttons</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button loading size="sm">Loading</Button>
              <Button loading variant="secondary" size="md">Loading</Button>
            </div>
          </Col>
        </Row>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 📝 INPUTS */}
      <Card title="Inputs" subtitle="Formular-Elemente">
        <Row>
          <Col size="6">
            <Input 
              label="Standard Input"
              placeholder="Geben Sie etwas ein..."
              helperText="Dies ist ein Hilfetext"
            />
            <Spacer size="md" />
            
            <Input 
              label="Input mit Fehler"
              placeholder="Fehler Input"
              error="Dies ist ein Fehler"
            />
            <Spacer size="md" />
            
            <Input 
              label="Input mit Icon"
              placeholder="Suche..."
              leftIcon="🔍"
            />
          </Col>
          
          <Col size="6">
            <Input 
              label="Email Input"
              type="email"
              placeholder="email@example.com"
              rightIcon="📧"
            />
            <Spacer size="md" />
            
            <Input 
              label="Password Input"
              type="password"
              placeholder="Passwort eingeben"
              rightIcon="🔒"
            />
            <Spacer size="md" />
            
            <Input 
              label="Disabled Input"
              placeholder="Deaktiviert"
              disabled
            />
          </Col>
        </Row>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 🏷️ BADGES */}
      <Card title="Badges" subtitle="Status und Kategorien">
        <Row>
          <Col size="6">
            <h4>Status Badges</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Badge variant="success">Erfolgreich</Badge>
              <Badge variant="warning">Warnung</Badge>
              <Badge variant="error">Fehler</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            
            <h4>Größen</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </Col>
          
          <Col size="6">
            <h4>Kategorie Badges</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Badge variant="primary">Wartung</Badge>
              <Badge variant="secondary">Reparatur</Badge>
              <Badge variant="default">Normal</Badge>
            </div>
            
            <h4>Priorität Badges</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant="success">Niedrig</Badge>
              <Badge variant="warning">Mittel</Badge>
              <Badge variant="error">Hoch</Badge>
            </div>
          </Col>
        </Row>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 📊 TABLES */}
      <Card title="Tables" subtitle="Daten-Tabellen">
        <Table striped hoverable>
          <thead>
            <tr>
              <th>Auftrag</th>
              <th>Kunde</th>
              <th>Status</th>
              <th>Priorität</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Wartung Aufzug Hauptstraße 15</td>
              <td>Gebäudeverwaltung München</td>
              <td><Badge variant="success">Abgeschlossen</Badge></td>
              <td><Badge variant="warning">Mittel</Badge></td>
              <td>
                <Button size="sm" variant="outline">Details</Button>
              </td>
            </tr>
            <tr>
              <td>Reparatur Aufzug Marienplatz</td>
              <td>Stadt München</td>
              <td><Badge variant="info">In Bearbeitung</Badge></td>
              <td><Badge variant="error">Hoch</Badge></td>
              <td>
                <Button size="sm" variant="outline">Details</Button>
              </td>
            </tr>
            <tr>
              <td>Notfall Aufzug Olympiapark</td>
              <td>Olympiapark GmbH</td>
              <td><Badge variant="warning">Offen</Badge></td>
              <td><Badge variant="error">Kritisch</Badge></td>
              <td>
                <Button size="sm" variant="outline">Details</Button>
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 🚨 ALERTS */}
      <Card title="Alerts" subtitle="Benachrichtigungen">
        {showAlert && (
          <Alert 
            type="success" 
            title="Erfolgreich gespeichert"
            onClose={() => setShowAlert(false)}
          >
            Die Zeiterfassung wurde erfolgreich gespeichert.
          </Alert>
        )}
        
        <Alert type="info" title="Information">
          Dies ist eine Informationsmeldung für den Benutzer.
        </Alert>
        
        <Alert type="warning" title="Warnung">
          Bitte überprüfen Sie Ihre Eingaben vor dem Speichern.
        </Alert>
        
        <Alert type="error" title="Fehler">
          Es ist ein Fehler beim Speichern aufgetreten.
        </Alert>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 📊 LOADING */}
      <Card title="Loading States" subtitle="Lade-Zustände">
        <Row>
          <Col size="4">
            <h4>Small Loading</h4>
            <Loading size="sm" text="Laden..." />
          </Col>
          <Col size="4">
            <h4>Medium Loading</h4>
            <Loading size="md" text="Daten werden geladen..." />
          </Col>
          <Col size="4">
            <h4>Large Loading</h4>
            <Loading size="lg" text="Bitte warten..." />
          </Col>
        </Row>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 🔍 MODAL */}
      <Card title="Modal" subtitle="Overlay-Dialoge">
        <Button onClick={() => setIsModalOpen(true)}>
          Modal öffnen
        </Button>
        
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          title="Beispiel Modal"
          size="md"
        >
          <p>Dies ist ein Beispiel-Modal mit dem Design-System.</p>
          <Spacer size="md" />
          <p>Es kann für verschiedene Zwecke verwendet werden:</p>
          <ul>
            <li>Bestätigungsdialoge</li>
            <li>Formulare</li>
            <li>Details anzeigen</li>
            <li>Einstellungen</li>
          </ul>
          <Spacer size="lg" />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Bestätigen
            </Button>
          </div>
        </Modal>
      </Card>
      
      <Spacer size="lg" />
      
      {/* 📱 LAYOUT */}
      <Card title="Layout System" subtitle="Grid und Container">
        <Row>
          <Col size="3">
            <Card padding="sm">
              <h4>1/4 Spalte</h4>
              <p>Kleine Inhalte</p>
            </Card>
          </Col>
          <Col size="3">
            <Card padding="sm">
              <h4>1/4 Spalte</h4>
              <p>Kleine Inhalte</p>
            </Card>
          </Col>
          <Col size="3">
            <Card padding="sm">
              <h4>1/4 Spalte</h4>
              <p>Kleine Inhalte</p>
            </Card>
          </Col>
          <Col size="3">
            <Card padding="sm">
              <h4>1/4 Spalte</h4>
              <p>Kleine Inhalte</p>
            </Card>
          </Col>
        </Row>
        
        <Spacer size="md" />
        
        <Row>
          <Col size="6">
            <Card padding="sm">
              <h4>1/2 Spalte</h4>
              <p>Mittlere Inhalte</p>
            </Card>
          </Col>
          <Col size="6">
            <Card padding="sm">
              <h4>1/2 Spalte</h4>
              <p>Mittlere Inhalte</p>
            </Card>
          </Col>
        </Row>
        
        <Spacer size="md" />
        
        <Row>
          <Col size="4">
            <Card padding="sm">
              <h4>1/3 Spalte</h4>
              <p>Mittlere Inhalte</p>
            </Card>
          </Col>
          <Col size="8">
            <Card padding="sm">
              <h4>2/3 Spalte</h4>
              <p>Größere Inhalte</p>
            </Card>
          </Col>
        </Row>
      </Card>
      
      <Spacer size="xxl" />
      
      {/* 📋 USAGE GUIDE */}
      <Card title="Verwendung im Code" subtitle="Wie man das Design-System verwendet">
        <h4>Import der Komponenten:</h4>
        <pre style={{ 
          background: '#f3f4f6', 
          padding: '16px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
{`import {
  Button,
  Input,
  Card,
  Badge,
  Table,
  Modal,
  Loading,
  Alert,
  Container,
  Row,
  Col
} from './components/ui/DesignSystem';`}
        </pre>
        
        <Spacer size="md" />
        
        <h4>Beispiel für Monteur-Bereich:</h4>
        <pre style={{ 
          background: '#f3f4f6', 
          padding: '16px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
{`<Card title="Zeiterfassung" subtitle="Aktuelle Arbeitszeit">
  <Row>
    <Col size="6">
      <Input 
        label="Standort"
        placeholder="Aktueller Standort"
      />
    </Col>
    <Col size="6">
      <Button variant="primary" size="lg">
        Einstempeln
      </Button>
    </Col>
  </Row>
</Card>`}
        </pre>
        
        <Spacer size="md" />
        
        <h4>Beispiel für Büro-Bereich:</h4>
        <pre style={{ 
          background: '#f3f4f6', 
          padding: '16px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
{`<Card title="Aufträge" subtitle="Übersicht aller Aufträge">
  <Table striped hoverable>
    <thead>
      <tr>
        <th>Auftrag</th>
        <th>Status</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Wartung Aufzug</td>
        <td><Badge variant="success">Abgeschlossen</Badge></td>
        <td><Button size="sm">Details</Button></td>
      </tr>
    </tbody>
  </Table>
</Card>`}
        </pre>
      </Card>
    </Container>
  );
};

export default DesignSystemExample; 