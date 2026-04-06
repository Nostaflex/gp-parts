import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Zap } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { getFeaturedProducts, getPromotedProducts } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';

export default function HomePage() {
  const featured = getFeaturedProducts(4);
  const promoted = getPromotedProducts();

  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-overline uppercase text-volcanic mb-4 block">
              Pièces détachées — Guadeloupe
            </span>
            <h1 className="font-title text-display md:text-[4rem] leading-none text-basalt mb-6">
              PIÈCES DÉTACHÉES
              <br />
              <span className="text-volcanic">QUALITÉ</span> ORIGINALE
            </h1>
            <p className="text-body-lg text-basalt/70 mb-8 max-w-lg">
              Auto · Moto · Livraison 24h partout en Guadeloupe. Qualité garantie, prix
              transparents.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <ButtonLink href="/catalogue" variant="primary" size="lg">
                Voir le catalogue
                <ArrowRight size={20} strokeWidth={2} />
              </ButtonLink>
              <ButtonLink href="/catalogue?promo=1" variant="outline" size="lg">
                Nos promotions
              </ButtonLink>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-lin">
              <div>
                <p className="font-title text-h2 text-volcanic">500+</p>
                <p className="text-caption text-basalt/60 uppercase">Références</p>
              </div>
              <div>
                <p className="font-title text-h2 text-volcanic">24h</p>
                <p className="text-caption text-basalt/60 uppercase">Livraison</p>
              </div>
              <div>
                <p className="font-title text-h2 text-volcanic">98%</p>
                <p className="text-caption text-basalt/60 uppercase">Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Visuel hero — placeholder */}
          <div className="relative">
            <div className="aspect-square bg-ivory rounded-2xl shadow-medium flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-volcanic/10 mx-auto flex items-center justify-center mb-4">
                  <Zap size={48} className="text-volcanic" strokeWidth={1.5} />
                </div>
                <p className="text-overline uppercase text-basalt/40">Visuel hero</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bénéfices */}
      <section className="bg-ivory py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Truck size={28} strokeWidth={1.5} />,
                title: 'Livraison 24h',
                desc: 'Partout en Guadeloupe, suivi en temps réel',
              },
              {
                icon: <Shield size={28} strokeWidth={1.5} />,
                title: 'Qualité origine',
                desc: 'Pièces OEM, garanties constructeur',
              },
              {
                icon: <Clock size={28} strokeWidth={1.5} />,
                title: 'Support réactif',
                desc: "Notre équipe vous répond en moins d'une heure",
              },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-volcanic/10 rounded-lg flex items-center justify-center text-volcanic flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-title text-h4 text-basalt mb-1">{b.title}</h3>
                  <p className="text-body-sm text-basalt/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-title text-h2 text-basalt mb-8">Nos catégories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalogue?category=${cat.id}`}
              className="group bg-ivory rounded-xl p-6 text-center hover:shadow-medium transition-all duration-normal hover:-translate-y-0.5"
            >
              <p className="text-overline uppercase text-basalt/60 mb-2">{cat.label}</p>
              <p className="text-body-sm font-medium text-basalt group-hover:text-volcanic transition-colors">
                Voir →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Produits vedettes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-title text-h2 text-basalt mb-2">Produits vedettes</h2>
            <p className="text-body text-basalt/70">Sélection des pièces les plus demandées</p>
          </div>
          <ButtonLink
            href="/catalogue"
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Tout voir <ArrowRight size={16} />
          </ButtonLink>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promotions */}
      {promoted.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-title text-h2 text-basalt mb-8">
            En <span className="text-volcanic">promotion</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {promoted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
