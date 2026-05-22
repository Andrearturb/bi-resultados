type Props = {
  onFileSelected: (file: File) => void;
  loading: boolean;
};

export const UploadPanel = ({ onFileSelected, loading }: Props) => (
  <section className="upload-panel">
    <div>
      <p className="eyebrow">Importação local</p>
      <h2>Carregue a planilha para gerar o BI</h2>
      <p className="muted">
        O processamento acontece no navegador. Nenhum dado é enviado para backend ou banco de dados.
      </p>
    </div>

    <label className="upload-dropzone">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
      <span>{loading ? 'Processando planilha...' : 'Selecionar planilha .xlsx ou .csv'}</span>
      <small>Arraste e solte pode ser adicionado depois.</small>
    </label>
  </section>
);