import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, CreditCard, FileText, AlertCircle,
  CheckCircle2, Clock, XCircle, ChevronRight, Upload,
  Send, Loader2, RefreshCw, ShieldCheck, Calendar
} from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1/' });

// Carnet visual reutilizando estética del sistema
const CarnetSocioCard = ({ socio, cuenta }) => {
  const saldo = parseFloat(cuenta?.saldo || 0);
  const estadoColor = saldo >= 0 ? 'text-emerald-400' : 'text-red-400';
  const estadoBg = saldo >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-slate-900 to-zinc-900 border border-zinc-700/50 shadow-2xl p-6">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute top-10 right-10 w-20 h-20 rounded-full border-4 border-white" />
      </div>
      {/* Borde activo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

      <div className="relative z-10 flex items-start gap-5">
        {/* Foto */}
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-zinc-600 bg-zinc-800 flex items-center justify-center shrink-0">
          {socio?.foto
            ? <img src={`http://localhost:8000${socio.foto}`} alt="Foto" className="w-full h-full object-cover" />
            : <User size={32} className="text-zinc-500" />
          }
        </div>

        {/* Datos */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Socio N°</p>
          <p className="text-2xl font-black text-white leading-tight">{socio?.nro_socio || '—'}</p>
          <p className="text-lg font-semibold text-zinc-100 mt-1 truncate">
            {socio?.apellidos}, {socio?.nombres}
          </p>
          <p className="text-sm text-zinc-400">DNI: {socio?.dni}</p>
        </div>
      </div>

      {/* Estado financiero inline */}
      <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${estadoBg} ${estadoColor}`}>
        {saldo >= 0
          ? <><CheckCircle2 size={14} /> Al día</>
          : <><AlertCircle size={14} /> Deuda: ${Math.abs(saldo).toLocaleString('es-AR')}</>
        }
      </div>
    </div>
  );
};

// Grilla de cuenta corriente
const CuentaCorrienteGrid = ({ movimientos }) => {
  if (!movimientos?.length) return (
    <div className="text-center py-10 text-zinc-500">
      <FileText size={32} className="mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay movimientos registrados aún.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-3 px-2 text-zinc-500 font-medium">Fecha</th>
            <th className="text-left py-3 px-2 text-zinc-500 font-medium">Concepto</th>
            <th className="text-right py-3 px-2 text-zinc-500 font-medium">Monto</th>
            <th className="text-right py-3 px-2 text-zinc-500 font-medium">Recibo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => {
            const positivo = parseFloat(m.monto) >= 0;
            return (
              <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                <td className="py-3 px-2 text-zinc-400 whitespace-nowrap">{m.fecha}</td>
                <td className="py-3 px-2 text-zinc-300">{m.descripcion}</td>
                <td className={`py-3 px-2 text-right font-mono font-medium ${positivo ? 'text-emerald-400' : 'text-red-400'}`}>
                  {positivo ? '+' : ''}{parseFloat(m.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </td>
                <td className="py-3 px-2 text-right">
                  {positivo && (
                    <a
                      href={`http://localhost:8000/api/v1/finanzas/movimientos/${m.id}/pdf/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FileText size={12} /> PDF
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Panel de aviso de pago
const AvisarPagoPanel = ({ token, onSuccess }) => {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('monto_declarado', monto);
      formData.append('fecha_declarada', fecha);
      formData.append('descripcion', descripcion);
      if (comprobante) formData.append('comprobante', comprobante);

      await api.post('finanzas/mis-avisos/', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setEnviado(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar el aviso.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) return (
    <div className="text-center py-8">
      <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3" />
      <p className="text-white font-semibold">¡Aviso enviado!</p>
      <p className="text-zinc-400 text-sm mt-1">El club validará tu pago y tu recibo aparecerá aquí.</p>
      <button onClick={() => setEnviado(false)} className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline">
        Enviar otro aviso
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Monto ($)</label>
          <input
            type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition-all"
            placeholder="5000" required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Fecha del pago</label>
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition-all"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Concepto</label>
        <input
          type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition-all"
          placeholder="Ej: Cuota Abril 2026" required
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Comprobante (opcional)</label>
        <label className="flex items-center gap-3 px-4 py-3 bg-zinc-800/30 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition-colors group">
          <Upload size={16} className="text-zinc-500 group-hover:text-zinc-300" />
          <span className="text-sm text-zinc-500 group-hover:text-zinc-300">
            {comprobante ? comprobante.name : 'Subir foto del comprobante'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setComprobante(e.target.files[0])} />
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="animate-spin" size={16} /> Enviando...</> : <><Send size={16} /> Avisar que pagué</>}
      </button>
    </form>
  );
};

// Badge de estado de aviso
const EstadoBadge = ({ estado }) => {
  const cfg = {
    PENDIENTE: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock size={12} />, label: 'Pendiente' },
    VALIDADO:  { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={12} />, label: 'Validado' },
    RECHAZADO: { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <XCircle size={12} />, label: 'Rechazado' },
  }[estado] || {};
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};


// ── PÁGINA PRINCIPAL ──
const SocioDashboardPage = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('socio_token');
  const user  = JSON.parse(sessionStorage.getItem('socio_user') || '{}');
  const [tab, setTab] = useState('cuenta'); // cuenta | avisar | avisos
  const [loading, setLoading] = useState(true);
  const [socio, setSocio] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    if (!token) { navigate('/socio/login'); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Traemos el perfil del socio desde el usuario logueado
      const [socioRes, avisosRes] = await Promise.all([
        api.get(`socios/`, { headers }),
        api.get('finanzas/mis-avisos/', { headers }),
      ]);
      // El primer socio del array es el del usuario logueado (multi-tenant ya filtra)
      const miSocio = socioRes.data.find(s => s.usuario === user.id) || socioRes.data[0];
      setSocio(miSocio);

      if (miSocio) {
        const cuentaRes = await api.get(`finanzas/socios/${miSocio.id}/cuenta/`, { headers });
        setCuenta(cuentaRes.data);
      }
      setAvisos(avisosRes.data);
    } catch (err) {
      console.error('Error cargando datos del socio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('socio_token');
    sessionStorage.removeItem('socio_user');
    navigate('/socio/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="animate-spin text-red-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-red-500" />
          <span className="font-bold text-sm">Portal del Socio</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
          <LogOut size={14} /> Salir
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Carnet */}
        <CarnetSocioCard socio={socio} cuenta={cuenta} />

        {/* Datos personales (colapsados) */}
        {socio && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mis Datos</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Fecha de nacimiento', socio.fecha_nacimiento],
                ['Teléfono', socio.telefono || '—'],
                ['Email', socio.email_contacto || '—'],
                ['Domicilio', socio.domicilio || '—'],
                ['Grupo Sanguíneo', socio.grupo_sanguineo || '—'],
                ['Categoría', socio.perfil_deportivo?.categoria_actual || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-zinc-500 text-xs">{label}</p>
                  <p className="text-zinc-200 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          {[
            { id: 'cuenta', label: 'Cuenta Corriente', icon: <CreditCard size={14} /> },
            { id: 'avisar', label: 'Avisé que Pagué', icon: <Send size={14} /> },
            { id: 'avisos', label: `Mis Avisos (${avisos.length})`, icon: <Clock size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-medium pb-3 px-1 border-b-2 transition-all ${
                tab === t.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Contenido del tab */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
          {tab === 'cuenta' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-300">Historial de Movimientos</h3>
                <button onClick={fetchData} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <CuentaCorrienteGrid movimientos={cuenta?.movimientos} />
            </>
          )}

          {tab === 'avisar' && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-zinc-300">Notificar un Pago</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Completá el formulario y el club validará tu pago. Una vez aprobado, tu recibo estará disponible.
                </p>
              </div>
              <AvisarPagoPanel token={token} onSuccess={fetchData} />
            </>
          )}

          {tab === 'avisos' && (
            <>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Estado de mis Avisos</h3>
              {avisos.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-6">No enviaste avisos aún.</p>
              ) : (
                <div className="space-y-3">
                  {avisos.map(a => (
                    <div key={a.id} className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-200 text-sm font-medium truncate">{a.descripcion}</p>
                          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> {a.fecha_declarada} — ${parseFloat(a.monto_declarado).toLocaleString('es-AR')}
                          </p>
                          {a.estado === 'RECHAZADO' && a.observacion_rechazo && (
                            <p className="text-red-400 text-xs mt-1 flex items-start gap-1">
                              <AlertCircle size={10} className="mt-0.5 shrink-0" /> {a.observacion_rechazo}
                            </p>
                          )}
                          {a.estado === 'VALIDADO' && a.movimiento_generado && (
                            <a
                              href={`http://localhost:8000/api/v1/finanzas/movimientos/${a.movimiento_generado}/pdf/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
                            >
                              <FileText size={10} /> Ver Recibo PDF
                            </a>
                          )}
                        </div>
                        <EstadoBadge estado={a.estado} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocioDashboardPage;
