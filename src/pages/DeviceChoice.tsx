export function DeviceChoice({ onChoose }: { onChoose: (device: 'phone' | 'computer') => void }) {
  return <section className="device-choice-page">
    <div className="device-choice panel">
      <small>ВЫБЕРИ УСТРОЙСТВО</small>
      <h1>Где ты будешь играть?</h1>
      <p>Управление будет настроено под выбранное устройство.</p>
      <div className="device-options">
        <button onClick={()=>onChoose('phone')}><span>📱</span><b>ТЕЛЕФОН</b><em>Сенсорное управление</em></button>
        <button onClick={()=>onChoose('computer')}><span>💻</span><b>КОМПЬЮТЕР</b><em>Клавиатура и мышь</em></button>
      </div>
    </div>
  </section>;
}
