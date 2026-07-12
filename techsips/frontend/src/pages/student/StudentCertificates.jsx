import React, { useEffect, useState } from 'react';
import { Award, Download, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function StudentCertificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data } = await api.get('/students/certificates');
      setCerts(data.data || []);
    } catch (err) {
      console.warn('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (cert) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600],
      });

      // Background theme (dark blue and gold accent)
      doc.setFillColor(15, 15, 26); // Dark blue bg
      doc.rect(0, 0, 800, 600, 'F');

      // Border lines (gold colors)
      doc.setDrawColor(212, 175, 55); // Gold border
      doc.setLineWidth(4);
      doc.rect(20, 20, 760, 560);

      doc.setLineWidth(1);
      doc.rect(25, 25, 750, 550);

      // Certificate header
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('TECHSIPS LEARNING PLATFORM', 400, 80, { align: 'center' });

      // Gold badge icon design
      doc.setFillColor(212, 175, 55);
      doc.circle(400, 160, 30, 'F');
      doc.setTextColor(15, 15, 26);
      doc.setFontSize(16);
      doc.text('TS', 400, 165, { align: 'center' });

      // Certificate of Completion title
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(36);
      doc.text('CERTIFICATE OF COMPLETION', 400, 240, { align: 'center' });

      // Student name details
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('This is proudly presented to', 400, 280, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(cert.users?.full_name?.toUpperCase() || 'STUDENT NAME', 400, 320, { align: 'center' });

      // Course text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('for successfully completing the technology bootcamp cohort', 400, 360, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(22);
      doc.text(cert.courses?.title || 'COURSE TITLE', 400, 400, { align: 'center' });

      // Footer values
      doc.setDrawColor(55, 55, 80);
      doc.line(100, 490, 300, 490);
      doc.line(500, 490, 700, 490);

      doc.setTextColor(150, 150, 170);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      
      // Date and Signatures
      const issueDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Issued Date: ${issueDate}`, 200, 510, { align: 'center' });
      doc.text('Verified Platform Mentor', 600, 510, { align: 'center' });

      // Verification code
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 120);
      doc.text(`Verification Hash: ${cert.certificate_code}`, 400, 550, { align: 'center' });

      doc.save(`TechSips-Certificate-${cert.certificate_code}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF certificate.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Certificates</h1>
        <p className="text-sm text-slate-500 mt-1">Credentials earned on successful course completions.</p>
      </div>

      {certs.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Award className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p>No certificates earned yet. Reach 100% progress on any course to unlock credentials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((cert) => (
            <div key={cert.id} className="glass-card p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-4">
                <span className="p-3 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0">
                  <Award className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{cert.courses?.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">Instructor: {cert.courses?.users?.full_name}</p>
                  <p className="text-xs text-brand-500 font-bold mt-1 uppercase">Hash: {cert.certificate_code}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t dark:border-darkBorder/40 text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                </span>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/verify-certificate/${cert.certificate_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkCard rounded-lg font-semibold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Verify Online</span>
                  </Link>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
